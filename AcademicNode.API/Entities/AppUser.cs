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

        public DateTime DateOfBirth { get; set; }
        public string KnownAs { get; set; }
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<PostLike> LikedPosts { get; set; }

        // Daca ai roluri
        public ICollection<AppUserRole> UserRoles { get; set; }

        public ICollection<Post> Posts { get; set; }
    }
}