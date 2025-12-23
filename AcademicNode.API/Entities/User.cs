using Microsoft.AspNetCore.Identity; // <--- Import obligatoriu

namespace AcademicNode.API.Entities
{
    // Aici e cheia: ": IdentityUser" inseamna ca User primeste toate puterile (Id, Email, Parola hash)
    public class User : IdentityUser
    {
        // Poti adauga doar campuri EXTRA, care nu exista in IdentityUser standard.
        // De exemplu, daca vrei sa stii cand s-a nascut:
        // public DateTime DateOfBirth { get; set; }

        // NU mai scrie public int Id { get; set; } -> E deja inclus
        // NU mai scrie public string UserName { get; set; } -> E deja inclus
        // NU mai scrie public string Password { get; set; } -> E deja inclus
    }
}