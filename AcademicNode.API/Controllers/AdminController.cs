using AcademicNode.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcademicNode.API.Controllers
{
    // Aici e magia: Nimeni nu poate intra aici daca nu are rolul de "Admin" in token
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;

        public AdminController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        // 1. GET: Trimitem lista cu useri catre Angular
        [HttpGet("users-with-roles")]
        public async Task<ActionResult> GetUsersWithRoles()
        {
            var users = await _userManager.Users
                .Include(u => u.UserRoles)            
                .ThenInclude(ur => ur.Role)
                .OrderBy(u => u.UserName)
                .Select(u => new
                {
                    u.Id,
                    Username = u.UserName,
                    KnownAs = u.KnownAs,
                    Roles = u.UserRoles.Select(r => r.Role.Name).ToList()
                })
                .ToListAsync();

            return Ok(users);
        }

        // 2. POST: Schimbam rolurile unui user
        // Angular ne va trimite username-ul in URL si noile roluri prin body (ex: "?roles=Professor,Student")
        [HttpPost("edit-roles/{username}")]
        public async Task<ActionResult> EditRoles(string username, [FromQuery] string roles)
        {
            if (string.IsNullOrEmpty(roles)) return BadRequest("Trebuie să selectezi cel puțin un rol");

            // Separam string-ul "Professor,Admin" in o lista ["Professor", "Admin"]
            var selectedRoles = roles.Split(",").ToArray();

            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound("Userul nu a fost găsit");

            // Aflam ce roluri are userul in prezent
            var userRoles = await _userManager.GetRolesAsync(user);

            // Adaugam rolurile noi pe care NU le are deja
            var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));
            if (!result.Succeeded) return BadRequest("Nu am putut adăuga rolurile");

            // Stergem rolurile vechi pe care NU le-a mai selectat adminul in Angular
            result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));
            if (!result.Succeeded) return BadRequest("Nu am putut șterge rolurile vechi");

            return Ok(await _userManager.GetRolesAsync(user));
        }
    }
}