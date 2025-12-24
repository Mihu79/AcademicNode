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
                .Include(p => p.Likes)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        [HttpPost]
        // [FromForm] este CRITIC! Ii spune serverului sa nu astepte JSON, ci date de formular
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
                AppUser = appUser
            };

            // --- LOGICA PENTRU POZA ---
            if (postDto.File != null && postDto.File.Length > 0)
            {
                // 1. Generam un nume unic fisierului (ca sa nu se suprascrie daca doi useri pun "poza.jpg")
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(postDto.File.FileName);

                // 2. Calea unde salvam: folderul wwwroot/uploads
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

                // Cream folderul daca nu exista
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                var filePath = Path.Combine(folderPath, fileName);

                // 3. Copiem fisierul fizic pe hard disk
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await postDto.File.CopyToAsync(stream);
                }

                // 4. Salvam URL-ul in baza de date (calea relativa)
                // Accesibil la http://localhost:5160/uploads/nume_poza.jpg
                post.PhotoUrl = "uploads/" + fileName;
            }
            // --------------------------

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return Ok(post);
        }

        [HttpPut("{id}")]
        // --- AM ADAUGAT [FromForm] AICI ---
        public async Task<ActionResult> UpdatePost(int id, [FromForm] PostDto postDto)
        {
            var post = await _context.Posts.FindAsync(id);

            if (post == null) return NotFound("Postarea nu există");

            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            if (post.AppUserId != currentUserId)
            {
                return Unauthorized("Nu poți edita postarea altcuiva!");
            }

            // Actualizam datele
            post.Title = postDto.Title;
            post.Content = postDto.Content;

            // Optional: Daca vrei sa permiti si schimbarea pozei la editare in viitor:
            /*
            if(postDto.File != null) {
                // Logica de salvare poza...
            }
            */

            await _context.SaveChangesAsync();

            return Ok(post);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePost(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            // Verificam daca e postarea mea
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            if (post.AppUserId != currentUserId) return Unauthorized("Nu poti sterge postarea altcuiva!");

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Sters" });
        }

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
    }
}