using AcademicNode.API.Data;
using AcademicNode.API.Entities;
using AcademicNode.API.Interfaces;
using AcademicNode.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization; // <--- NECESAR PENTRU FIX

var builder = WebApplication.CreateBuilder(args);

// --- AICI ESTE FIX-UL PENTRU EROAREA 500 ---
builder.Services.AddControllers().AddJsonOptions(opt =>
{
    opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
// -------------------------------------------

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<DataContext>(opt =>
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddIdentityCore<AppUser>(opt =>
{
    // --- SETARI PENTRU PAROLA SIMPLA ---
    opt.Password.RequireNonAlphanumeric = false; // Nu cere simboluri (!@#)
    opt.Password.RequireDigit = false;           // Nu cere cifre obligatoriu
    opt.Password.RequireLowercase = false;       // Nu cere litere mici
    opt.Password.RequireUppercase = false;       // Nu cere litere mari
    opt.Password.RequiredLength = 4;             // Lungime minima 4
    // -----------------------------------
})
    .AddRoles<AppRole>()
    .AddRoleManager<RoleManager<AppRole>>()
    .AddEntityFrameworkStores<DataContext>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["TokenKey"])),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddCors();

builder.Services.AddScoped<FileService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseCors(x => x.AllowAnyHeader()
    .AllowAnyMethod()
    .WithOrigins("http://localhost:4200"));

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- DATA SEEDING (Roluri si Admin cu ASP.NET Identity) ---
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    // Folosim managerii nativi din Identity
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    var roleManager = services.GetRequiredService<RoleManager<AppRole>>();

    // 1. Definim rolurile noastre
    var roles = new List<string> { "Admin", "Professor", "Student", "Normal" };

    foreach (var role in roles)
    {
        // Daca rolul nu exista in baza de date, il cream
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new AppRole { Name = role });
        }
    }

    // 2. Cream contul de Admin Suprem (daca nu exista deja)
    var adminUsername = "admin";
    var adminUser = await userManager.FindByNameAsync(adminUsername);

    if (adminUser == null)
    {
        var admin = new AppUser
        {
            UserName = adminUsername,
            Email = "admin@academicnode.com",
            KnownAs = "Administrator",
            City = "Craiova",
            Country = "Romania",
            Gender = "N/A"
        };

        // Cream userul cu o parola initiala puternica
        var result = await userManager.CreateAsync(admin, "Admin123!");

        if (result.Succeeded)
        {
            // Ii dam rolul de Admin (si optional Profesor ca sa poata posta direct cursuri)
            await userManager.AddToRolesAsync(admin, new[] { "Admin", "Professor" });
            Console.WriteLine("--- [SEED] Rolurile si contul ADMIN au fost create! ---");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[EROARE SEEDING]: {ex.Message}");
}
// ----------------------------------------------------------


app.Run();