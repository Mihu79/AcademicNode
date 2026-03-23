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
            // Chiar daca parametrul se cheama inca "roles" (ca sa nu stricam Angular-ul), 
            // noi il vom trata ca pe un singur rol.
            if (string.IsNullOrEmpty(roles)) return BadRequest("Trebuie să selectezi un rol");

            // Daca din greseala Angular inca trimite "Admin,Professor", noi luam doar primul cuvant.
            // Daca trimite doar "Professor", e perfect.
            var selectedRole = roles.Split(",").First().Trim();

            var user = await _userManager.FindByNameAsync(username);
            if (user == null) return NotFound("Userul nu a fost găsit");

            // 1. Aflam TOATE rolurile pe care le are userul in prezent (ca sa facem curatenie generala)
            var currentRoles = await _userManager.GetRolesAsync(user);

            // 2. Stergem ABSOLUT TOATE rolurile vechi
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded) return BadRequest("Nu am putut șterge rolurile vechi");

            // 3. Ii dam DOAR noul rol selectat
            var addResult = await _userManager.AddToRoleAsync(user, selectedRole);
            if (!addResult.Succeeded) return BadRequest("Nu am putut adăuga noul rol. Verifică dacă rolul există în baza de date.");

            // Returnam noua lista (care acum va avea mereu un singur element)
            return Ok(await _userManager.GetRolesAsync(user));
        }
    }
}