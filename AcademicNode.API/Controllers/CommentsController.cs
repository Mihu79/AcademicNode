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
    public class CommentsController : ControllerBase
    {
        private readonly DataContext _context;

        public CommentsController(DataContext context)
        {
            _context = context;
        }

        [HttpPost("{postId}")]
        // ATENTIE: Aici primim [FromBody] CreateCommentDto (cel nou)
        public async Task<ActionResult<CommentDto>> AddComment(int postId, [FromBody] CreateCommentDto createDto)
        {
            var post = await _context.Posts.FindAsync(postId);
            if (post == null) return NotFound("Postarea nu există");

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);

            var comment = new Comment
            {
                // Luam continutul din noul DTO
                Content = createDto.Content,
                PostId = postId,
                AppUserId = userId,
                AppUser = user
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return Ok(new CommentDto
            {
                Id = comment.Id,
                Content = comment.Content,
                Username = user.UserName,
                CreatedAt = comment.CreatedAt
                // UserPhotoUrl = ... (daca ai implementat poze la useri)
            });
        }
    }
}