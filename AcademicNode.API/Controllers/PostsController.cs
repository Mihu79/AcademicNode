using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using AcademicNode.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AcademicNode.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PostsController : ControllerBase
    {
        private readonly DataContext _context;

        public PostsController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Post>>> GetPosts()
        {
            return await _context.Posts
                .Include(p => p.AppUser)
                .ThenInclude(u => u.UserRoles) 
                .ThenInclude(ur => ur.Role)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.AppUser)
                .OrderByDescending(p => p.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();
        }

        [HttpGet("user/{username}")]
        public async Task<ActionResult<IEnumerable<Post>>> GetUserPosts(string username)
        {
            var posts = await _context.Posts
                .Include(p => p.AppUser)
                .Include(p => p.Likes)
                .Include(p => p.Comments)
                    .ThenInclude(c => c.AppUser)
                .Where(p => p.AppUser.UserName.ToLower() == username.ToLower())
                .OrderByDescending(p => p.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();

            return Ok(posts);
        }

        [HttpPost]
        public async Task<ActionResult<Post>> CreatePost([FromForm] PostDto postDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var appUser = await _context.Users.FindAsync(userId);

            if (appUser == null) return BadRequest("User not found");

            var post = new Post
            {
                Title = postDto.Title,
                Content = postDto.Content,
                AppUserId = userId,
                AppUser = appUser,
                CreatedAt = DateTime.UtcNow // Adaugat pentru siguranta
            };

            // --- LOGICA PENTRU FISIER (POZA SAU PDF) ---
            if (postDto.File != null && postDto.File.Length > 0)
            {
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(postDto.File.FileName);

                // Verificam daca e PDF sau Imagine pentru a alege folderul corect
                bool isPdf = postDto.File.ContentType == "application/pdf";
                var folderName = isPdf ? "files" : "uploads";

                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);

                if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await postDto.File.CopyToAsync(stream);
                }

                // Salvam in baza de date in functie de tip
                if (isPdf)
                {
                    post.FileUrl = folderName + "/" + fileName;
                    post.IsPdf = true;
                }
                else
                {
                    post.PhotoUrl = folderName + "/" + fileName;
                    post.IsPdf = false;
                }
            }

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return Ok(post);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // --- LOGICA DE ADMIN: Poate sterge orice ---
            // Verificam daca userul are claim-ul de role 'Admin'
            var isAdmin = User.IsInRole("Admin");

            if (post.AppUserId != currentUserId && !isAdmin)
            {
                return Unauthorized("Nu poți șterge postarea altcuiva (doar dacă ești Admin)!");
            }

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Sters cu succes" });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePost(int id, [FromForm] UpdatePostDto postDto)
        {
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound("Postarea nu există.");

            var isAdmin = User.IsInRole("Admin");
            if (post.AppUserId != currentUserId && !isAdmin)
            {
                return Forbid("Nu ai permisiunea să editezi această postare.");
            }

            // 1. Daca trimitem titlu/continut nou, le actualizam
            if (!string.IsNullOrEmpty(postDto.Title)) post.Title = postDto.Title;
            if (!string.IsNullOrEmpty(postDto.Content)) post.Content = postDto.Content;

            // 2. VERIFICAM DACA A FOST INCARCAT UN FISIER NOU
            if (postDto.File != null && postDto.File.Length > 0)
            {
                var extension = Path.GetExtension(postDto.File.FileName);
                var fileName = Guid.NewGuid().ToString() + extension;

                var folderName = extension.ToLower() == ".pdf" ? "documents" : "images";
                var uploadFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);

                if (!Directory.Exists(uploadFolder))
                {
                    Directory.CreateDirectory(uploadFolder);
                }

                var filePath = Path.Combine(uploadFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await postDto.File.CopyToAsync(stream);
                }

                if (extension.ToLower() == ".pdf")
                {
                    post.FileUrl = Path.Combine(folderName, fileName).Replace("\\", "/");
                    post.IsPdf = true;
                    post.PhotoUrl = null;
                }
                else
                {
                    post.PhotoUrl = Path.Combine(folderName, fileName).Replace("\\", "/");
                    post.IsPdf = false;
                    post.FileUrl = null;
                }
            }

            // 3. Salvam in Baza de Date
            // Chiar daca SaveChanges() e 0 (adica nu s-a modificat nimic), returnam OK ca sa nu dea eroare pe frontend.
            await _context.SaveChangesAsync();

            return Ok();
        }

        // ... Metodele de Like si Comment ramân la fel ...
        [HttpPost("{postId}/like")]
        public async Task<ActionResult> LikePost(int postId)
        {
            var sourceUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var post = await _context.Posts.Include(p => p.Likes).FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return NotFound();
            var existingLike = await _context.Likes.FindAsync(sourceUserId, postId);
            if (existingLike != null)
            {
                _context.Likes.Remove(existingLike);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Unliked" });
            }
            var like = new PostLike { SourceUserId = sourceUserId, TargetPostId = postId };
            _context.Likes.Add(like);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Liked" });
        }

        [HttpPost("{postId}/comment")]
        public async Task<ActionResult> AddComment(int postId, CommentDto commentDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();
            var post = await _context.Posts.Include(p => p.Comments).FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return NotFound("Postarea nu există");
            var comment = new Comment
            {
                Content = commentDto.Content,
                AppUserId = userId,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };
            post.Comments.Add(comment);
            if (await _context.SaveChangesAsync() > 0)
            {
                return Ok(new { Id = comment.Id, Content = comment.Content, Username = user.UserName, PhotoUrl = user.PhotoUrl, CreatedAt = comment.CreatedAt });
            }
            return BadRequest("Eroare la adăugarea comentariului");
        }
    }
}