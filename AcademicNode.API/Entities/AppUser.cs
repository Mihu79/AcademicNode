using Microsoft.AspNetCore.Identity;
using System.Text.Json.Serialization;

namespace AcademicNode.API.Entities
{
    // Moștenim IdentityUser<int> ca să avem ID-uri numerice (1, 2, 3...)
    public class AppUser : IdentityUser<int>
    {
        // NU mai scrie public int Id { get; set; } -> Vine automat din IdentityUser
        // NU mai scrie public string UserName { get; set; } -> Vine automat
        // NU mai scrie public string Email { get; set; } -> Vine automat

       

        [JsonIgnore]
        public ICollection<PostLike> LikedPosts { get; set; }

        // Daca ai roluri
        public ICollection<AppUserRole> UserRoles { get; set; }

        public ICollection<Post> Posts { get; set; }

        // ... in interiorul clasei AppUser
        public ICollection<Education> Educations { get; set; } = new List<Education>();
        public ICollection<Experience> Experiences { get; set; } = new List<Experience>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
        public ICollection<Certification> Certifications { get; set; } = new List<Certification>();

        public DateTime DateOfBirth { get; set; }
        public string KnownAs { get; set; } // Porecla sau Nume de scena
        public DateTime Created { get; set; } = DateTime.Now;
        public DateTime LastActive { get; set; } = DateTime.Now;
        public string Gender { get; set; }
        public string Introduction { get; set; } // Bio / Despre mine
        public string City { get; set; }
        public string Country { get; set; }

        // Poza de profil (separata de pozele din postari)
        public string PhotoUrl { get; set; }
        // -----------------------------------------------

       
    }
}