using AcademicNode.API.Data;
using AcademicNode.API.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcademicNode.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly DataContext _context;

        public UsersController(DataContext context)
        {
            _context = context;
        }

        // Returneaza lista de utilizatori (AppUser)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // Returneaza un singur utilizator dupa ID
        [HttpGet("{id}")]
        public async Task<ActionResult<AppUser>> GetUser(string id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null) return NotFound();

            return user;
        }
    }
}