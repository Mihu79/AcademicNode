using AcademicNode.API.DTOs;
using AcademicNode.API.Entities;
using AcademicNode.API.Interfaces;
using AcademicNode.API.Services; // Asigura-te ca adaugi acest using pentru IEmailService
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities; // Obligatoriu pt WebEncoders
using Microsoft.EntityFrameworkCore;
using System.Text; // Obligatoriu pt Encoding

namespace AcademicNode.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService; // NOU: Adaugam serviciul nostru de email

        // NOU: L-am adaugat pe _emailService in constructor
        public AccountController(UserManager<AppUser> userManager, ITokenService tokenService, IEmailService emailService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            if (await _userManager.Users.AnyAsync(x => x.NormalizedEmail == registerDto.Email.ToUpper()))
                return BadRequest("Email-ul este deja folosit");

            var user = new AppUser
            {
                UserName = registerDto.Username,
                Email = registerDto.Email,
                KnownAs = registerDto.Username,
                Created = DateTime.UtcNow,
                LastActive = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            await _userManager.AddToRoleAsync(user, "Normal");

            return new UserDto
            {
                Username = user.UserName,
                Token = await _tokenService.CreateTokenAsync(user),
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
                Token = await _tokenService.CreateTokenAsync(user),
                Id = user.Id
            };
        }

        // --- NOU: ENDPOINT PENTRU CEREREA DE RESETARE (TRIMITE EMAILUL) ---
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                // Returnam OK chiar si cand greseste email-ul (Buna practica de Securitate)
                return Ok(new { message = "Dacă emailul există în sistem, am trimis un link." });
            }

            // Generam tokenul unic
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Il codam ca sa nu aiba caractere speciale ce strica link-ul
            var encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            // Link-ul catre Angular (presupun ca e pe portul 4200)
            var resetLink = $"http://localhost:4200/reset-password?email={user.Email}&token={encodedToken}";

            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; padding: 20px; background-color: #1e1e2f; color: #fff; border-radius: 8px;'>
                    <h2 style='color: #00ff88;'>Resetare Parolă - Academic Node</h2>
                    <p>Salut,</p>
                    <p>Am primit o cerere pentru resetarea parolei contului tău.</p>
                    <p>Dacă nu ai făcut tu asta, poți ignora acest email. Dacă da, apasă pe butonul de mai jos:</p>
                    <br>
                    <a href='{resetLink}' style='display: inline-block; padding: 10px 20px; background-color: #d500f9; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;'>Resetează Parola</a>
                    <br><br>
                    <p>Dacă butonul nu funcționează, copiază acest link în browser-ul tău:</p>
                    <p style='color: #0dcaf0; font-size: 12px;'>{resetLink}</p>
                </div>";

            await _emailService.SendEmailAsync(user.Email, "Resetare Parolă - Academic Node", emailBody);

            return Ok(new { message = "Email-ul a fost trimis cu succes!" });
        }


        // --- NOU: ENDPOINT PENTRU RESETAREA EFECTIVA A PAROLEI ---
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null) return BadRequest("Cerere invalidă.");

            try
            {
                // Decodam inapoi tokenul
                var decodedTokenBytes = WebEncoders.Base64UrlDecode(dto.Token);
                var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

                // Apelam metoda built-in din Identity pentru a o inlocui in baza de date
                var result = await _userManager.ResetPasswordAsync(user, decodedToken, dto.NewPassword);

                if (result.Succeeded)
                {
                    return Ok(new { message = "Parola a fost resetată cu succes!" });
                }

                return BadRequest("Link-ul de resetare este invalid sau a expirat.");
            }
            catch
            {
                return BadRequest("Datele furnizate sunt corupte.");
            }
        }
    }
}