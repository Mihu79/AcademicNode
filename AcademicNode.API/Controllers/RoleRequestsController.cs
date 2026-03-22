using AcademicNode.API.Data;
using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AcademicNode.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RoleRequestsController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly UserManager<AppUser> _userManager;

        public RoleRequestsController(DataContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager; // Folosim UserManager pentru a schimba rolurile in siguranta
        }

        // 1. UTILIZATORUL NORMAL TRIMITE O CERERE
        [HttpPost]
        public async Task<ActionResult> CreateRequest(CreateRoleRequestDto requestDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // Verificam daca are deja o cerere in asteptare ca sa nu faca spam
            var existingRequest = await _context.RoleRequests
                .FirstOrDefaultAsync(r => r.AppUserId == userId && r.Status == "Pending");

            if (existingRequest != null) return BadRequest("Ai deja o cerere în așteptare!");

            var roleRequest = new RoleRequest
            {
                AppUserId = userId,
                RequestedRole = requestDto.RequestedRole,
                Message = requestDto.Message,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.RoleRequests.Add(roleRequest);
            if (await _context.SaveChangesAsync() > 0) return Ok(new { message = "Cererea a fost trimisă cu succes!" });

            return BadRequest("Eroare la salvarea cererii");
        }

        // 2. ADMINUL VEDE TOATE CERERILE IN ASTEPTARE
        [Authorize(Roles = "Admin")]
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingRequests()
        {
            var requests = await _context.RoleRequests
                .Include(r => r.AppUser)
                .Where(r => r.Status == "Pending")
                .OrderBy(r => r.CreatedAt)
                .Select(r => new {
                    r.Id,
                    r.RequestedRole,
                    r.Message,
                    r.CreatedAt,
                    Username = r.AppUser.UserName,
                    PhotoUrl = r.AppUser.PhotoUrl
                })
                .ToListAsync();

            return Ok(requests);
        }

        // 3. ADMINUL APROBA CEREREA
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/approve")]
        public async Task<ActionResult> ApproveRequest(int id)
        {
            var request = await _context.RoleRequests.Include(r => r.AppUser).FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return NotFound("Cererea nu există");
            if (request.Status != "Pending") return BadRequest("Această cerere a fost deja procesată.");

            var user = request.AppUser;

            // Scoatem rolul "Normal" si adaugam noul rol cerut (Student/Professor)
            await _userManager.RemoveFromRoleAsync(user, "Normal");
            var result = await _userManager.AddToRoleAsync(user, request.RequestedRole);

            if (!result.Succeeded) return BadRequest("Eroare la schimbarea rolului");

            // Schimbam statusul cererii
            request.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Rolul utilizatorului a fost schimbat în {request.RequestedRole}!" });
        }

        // 4. ADMINUL RESPINGE CEREREA (Optional)
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/reject")]
        public async Task<ActionResult> RejectRequest(int id)
        {
            var request = await _context.RoleRequests.FindAsync(id);
            if (request == null) return NotFound();

            request.Status = "Rejected";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cererea a fost respinsă." });
        }
    }
}