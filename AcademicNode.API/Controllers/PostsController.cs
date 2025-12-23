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
        public async Task<ActionResult<Post>> CreatePost(PostDto postDto)
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

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return Ok(post); // Returnam postarea creata
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdatePost(int id, PostDto postDto)
        {
            var post = await _context.Posts.FindAsync(id);
            if (post == null) return NotFound();

            // Verificam daca e postarea mea
            var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            if (post.AppUserId != currentUserId) return Unauthorized("Nu poti edita postarea altcuiva!");

            post.Title = postDto.Title;
            post.Content = postDto.Content;

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