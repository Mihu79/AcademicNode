using AcademicNode.API.Data;
using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AcademicNode.API.Controllers
{
    [Authorize] // Important: Doar userii logati pot vedea profiluri
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly DataContext _context;

        public UsersController(DataContext context)
        {
            _context = context;
        }

        // GET: api/users
        // Returneaza lista tuturor userilor, dar convertiti in MemberDto
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();

            // Convertim lista de Useri in lista de MemberDto
            var members = users.Select(user => MapToDto(user)).ToList();

            return Ok(members);
        }

        // GET: api/users/mihu
        // Cautam dupa USERNAME, nu dupa ID (e mai frumos in URL)
        [HttpGet("{username}")]
        public async Task<ActionResult<MemberDto>> GetUser(string username)
        {
            var user = await _context.Users
                .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound("Utilizatorul nu a fost găsit");

            return Ok(MapToDto(user));
        }

        // --- FUNCTIE AJUTATOARE PENTRU CONVERSIE ---
        // Asta muta datele din Baza de Date in obiectul curat (DTO)
        private MemberDto MapToDto(AppUser user)
        {
            // Calcul varsta
            var today = DateTime.Today;
            var age = today.Year - user.DateOfBirth.Year;
            if (user.DateOfBirth.Date > today.AddYears(-age)) age--;

            return new MemberDto
            {
                Id = user.Id,
                Username = user.UserName,
                PhotoUrl = user.PhotoUrl,
                Age = age,
                KnownAs = user.KnownAs,
                Created = user.Created,
                LastActive = user.LastActive,
                Gender = user.Gender,
                Introduction = user.Introduction,
                City = user.City,
                Country = user.Country
            };
        }
        [HttpPut]
        public async Task<ActionResult> UpdateUser(MemberUpdateDto memberUpdateDto)
        {
            // 1. Aflam cine este userul logat (din Token)
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            // 2. Il cautam in baza de date
            var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            // 3. Actualizam campurile
            user.Introduction = memberUpdateDto.Introduction;
            user.City = memberUpdateDto.City;
            user.Country = memberUpdateDto.Country;

            // 4. Salvam modificarile
            if (await _context.SaveChangesAsync() > 0) return NoContent();

            return BadRequest("Nu s-a putut actualiza profilul");
        }

        [HttpPost("add-photo")]
        public async Task<ActionResult<string>> AddPhoto(IFormFile file)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            if (file == null || file.Length == 0) return BadRequest("Nu ai selectat nicio poză");

            // 1. Generam un nume unic pentru fisier
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);

            // 2. Calea unde salvam (wwwroot/images)
            var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
            if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

            var filePath = Path.Combine(folderPath, fileName);

            // 3. Salvam fizic fisierul
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // 4. Actualizam userul in baza de date
            // URL-ul relativ pentru frontend
            var photoUrl = "images/" + fileName;
            user.PhotoUrl = photoUrl;

            if (await _context.SaveChangesAsync() > 0)
            {
                // Returnam noul URL catre frontend
                return Ok(new { url = photoUrl });
            }

            return BadRequest("Eroare la salvarea pozei");
        }
    }
}