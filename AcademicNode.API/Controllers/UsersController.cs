using AcademicNode.API.Data;
using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using AcademicNode.API.Interfaces;
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
            
                .Include(x => x.Experiences)
                .Include(x => x.Educations)
                .Include(x => x.Projects)
                .Include(x => x.Certifications)
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
                Country = user.Country,

                // AICI ESTE CHEIA: Mapam listele manual
                Experiences = user.Experiences.Select(e => new ExperienceDto
                {
                    Id = e.Id,
                    Company = e.Company,
                    Position = e.Position,
                    Description = e.Description,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate
                }).ToList(),

                Educations = user.Educations.Select(e => new EducationDto
                {
                    Id = e.Id,
                    School = e.School,
                    Degree = e.Degree,
                    FieldOfStudy = e.FieldOfStudy,
                    StartDate = e.StartDate,
                    EndDate = e.EndDate
                }).ToList(),

                Projects = user.Projects.Select(p => new ProjectDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    GithubLink = p.GithubLink,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate
                }).ToList(),

                Certifications = user.Certifications.Select(c => new CertificationDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Issuer = c.Issuer,
                    DateIssued = c.DateIssued
                }).ToList()
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

        // ====================================================================
        //                            EXPERIENCE
        // ====================================================================

        [HttpPost("add-experience")]
        public async Task<ActionResult<Experience>> AddExperience(Experience experience)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Experiences)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound("Utilizatorul nu a fost găsit");

            // Legam experienta de user
            user.Experiences.Add(experience);

            if (await _context.SaveChangesAsync() > 0)
            {
                // Returnam obiectul creat (cu tot cu ID-ul generat de baza de date)
                return Ok(experience);
            }

            return BadRequest("Eroare la adăugarea experienței");
        }

        [HttpDelete("delete-experience/{id}")]
        public async Task<ActionResult> DeleteExperience(int id)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Experiences)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            var exp = user.Experiences.FirstOrDefault(x => x.Id == id);
            if (exp == null) return NotFound("Experiența nu a fost găsită");

            user.Experiences.Remove(exp);

            if (await _context.SaveChangesAsync() > 0) return Ok();

            return BadRequest("Eroare la ștergerea experienței");
        }

        // ====================================================================
        //                             EDUCATION
        // ====================================================================

        [HttpPost("add-education")]
        public async Task<ActionResult<Education>> AddEducation(Education education)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Educations)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            user.Educations.Add(education);

            if (await _context.SaveChangesAsync() > 0) return Ok(education);

            return BadRequest("Eroare la adăugarea studiilor");
        }

        [HttpDelete("delete-education/{id}")]
        public async Task<ActionResult> DeleteEducation(int id)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Educations)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            var edu = user.Educations.FirstOrDefault(x => x.Id == id);
            if (edu == null) return NotFound();

            user.Educations.Remove(edu);

            if (await _context.SaveChangesAsync() > 0) return Ok();

            return BadRequest("Eroare la ștergere");
        }

        // ====================================================================
        //                              PROJECTS
        // ====================================================================

        [HttpPost("add-project")]
        public async Task<ActionResult<Project>> AddProject(Project project)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Projects)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            user.Projects.Add(project);

            if (await _context.SaveChangesAsync() > 0) return Ok(project);

            return BadRequest("Eroare la adăugarea proiectului");
        }

        [HttpDelete("delete-project/{id}")]
        public async Task<ActionResult> DeleteProject(int id)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Projects)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            var proj = user.Projects.FirstOrDefault(x => x.Id == id);
            if (proj == null) return NotFound();

            user.Projects.Remove(proj);

            if (await _context.SaveChangesAsync() > 0) return Ok();

            return BadRequest("Eroare la ștergere");
        }

        // ====================================================================
        //                           CERTIFICATIONS
        // ====================================================================

        [HttpPost("add-certification")]
        public async Task<ActionResult<Certification>> AddCertification(Certification certification)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Certifications)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            user.Certifications.Add(certification);

            if (await _context.SaveChangesAsync() > 0) return Ok(certification);

            return BadRequest("Eroare la adăugarea certificării");
        }

        [HttpDelete("delete-certification/{id}")]
        public async Task<ActionResult> DeleteCertification(int id)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Certifications)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            var cert = user.Certifications.FirstOrDefault(x => x.Id == id);
            if (cert == null) return NotFound();

            user.Certifications.Remove(cert);

            if (await _context.SaveChangesAsync() > 0) return Ok();

            return BadRequest("Eroare la ștergere");
        }
        // ===============================================================
        //  ADAUGA ACESTE METODE IN UsersController.cs PENTRU EDITARE
        // ===============================================================

        // ===============================================================
        //  METODE DE EDITARE (UPDATE) - ADAPTATE LA _context
        // ===============================================================

        [HttpPut("experience")]
        public async Task<ActionResult> UpdateExperience(ExperienceDto experienceDto)
        {
            // 1. Luam username-ul exact ca in celelalte metode
            var username = User.FindFirst(ClaimTypes.Name)?.Value;

            // 2. Folosim _context si includem lista de experiente
            var user = await _context.Users.Include(u => u.Experiences)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            // 3. Cautam experienta in lista userului
            var experience = user.Experiences.FirstOrDefault(x => x.Id == experienceDto.Id);
            if (experience == null) return NotFound("Experiența nu a fost găsită");

            // 4. Actualizam datele
            experience.Company = experienceDto.Company;
            experience.Position = experienceDto.Position;
            experience.Description = experienceDto.Description;
            experience.StartDate = experienceDto.StartDate;
            experience.EndDate = experienceDto.EndDate;

            // 5. Salvam folosind _context
            if (await _context.SaveChangesAsync() > 0) return NoContent();

            return BadRequest("Nu s-a putut actualiza experiența sau nu s-au făcut modificări.");
        }

        [HttpPut("education")]
        public async Task<ActionResult> UpdateEducation(EducationDto educationDto)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Educations)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            var education = user.Educations.FirstOrDefault(x => x.Id == educationDto.Id);
            if (education == null) return NotFound("Studiile nu au fost găsite");

            education.School = educationDto.School;
            education.Degree = educationDto.Degree;
            education.FieldOfStudy = educationDto.FieldOfStudy;
            education.StartDate = educationDto.StartDate;
            education.EndDate = educationDto.EndDate;

            if (await _context.SaveChangesAsync() > 0) return NoContent();

            return BadRequest("Nu s-au putut actualiza studiile");
        }

        [HttpPut("project")]
        public async Task<ActionResult> UpdateProject(ProjectDto projectDto)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Projects)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            var project = user.Projects.FirstOrDefault(x => x.Id == projectDto.Id);
            if (project == null) return NotFound("Proiectul nu a fost găsit");

            project.Name = projectDto.Name;
            project.Description = projectDto.Description;
            project.GithubLink = projectDto.GithubLink;
            project.StartDate = projectDto.StartDate;
            project.EndDate = projectDto.EndDate;

            if (await _context.SaveChangesAsync() > 0) return NoContent();

            return BadRequest("Nu s-a putut actualiza proiectul");
        }

        [HttpPut("certification")]
        public async Task<ActionResult> UpdateCertification(CertificationDto certificationDto)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value;
            var user = await _context.Users.Include(u => u.Certifications)
                                           .SingleOrDefaultAsync(x => x.UserName == username);

            if (user == null) return NotFound();

            var cert = user.Certifications.FirstOrDefault(x => x.Id == certificationDto.Id);
            if (cert == null) return NotFound("Certificarea nu a fost găsită");

            cert.Name = certificationDto.Name;
            cert.Issuer = certificationDto.Issuer;
            cert.DateIssued = certificationDto.DateIssued;

            if (await _context.SaveChangesAsync() > 0) return NoContent();

            return BadRequest("Nu s-a putut actualiza certificarea");
        }
    }
}