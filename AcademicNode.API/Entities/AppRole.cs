using Microsoft.AspNetCore.Identity;

namespace AcademicNode.API.Entities
{
    public class AppRole : IdentityRole<int>
    {
        public ICollection<AppUserRole> UserRoles { get; set; }
    }
}