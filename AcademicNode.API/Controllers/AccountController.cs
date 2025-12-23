using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using AcademicNode.API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcademicNode.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        // Folosim AppUser, nu User
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;

        // Injectam UserManager de tip AppUser si TokenService
        public AccountController(UserManager<AppUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            // Verificam daca userul exista
            if (await _userManager.Users.AnyAsync(x => x.NormalizedEmail == registerDto.Email.ToUpper()))
                return BadRequest("Email-ul este deja folosit");

            // ATENTIE: Aici cream un AppUser, NU un User
            var user = new AppUser
            {
                UserName = registerDto.Username,
                Email = registerDto.Email, // AppUser mosteneste Email din IdentityUser
                KnownAs = registerDto.Username, // Camp obligatoriu din AppUser (poti pune username temporar)
                Created = DateTime.UtcNow,
                LastActive = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // Returnam un DTO cu token, nu userul intreg
            return new UserDto
            {
                Username = user.UserName,
                Token = _tokenService.CreateToken(user),
                Id = user.Id
            };
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.Users
                .FirstOrDefaultAsync(x => x.NormalizedEmail == loginDto.Email.ToUpper());

            if (user == null) return Unauthorized("Email invalid");

            var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);

            if (!result) return Unauthorized("Parola gresita");

            return new UserDto
            {
                Username = user.UserName,
                Token = _tokenService.CreateToken(user),
                Id = user.Id
            };
        }
    }
}