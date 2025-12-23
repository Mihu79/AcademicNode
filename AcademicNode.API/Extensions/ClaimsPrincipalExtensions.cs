using System.Security.Claims;

namespace AcademicNode.API.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static int GetUserId(this ClaimsPrincipal user)
        {
            // Caută claim-ul care conține ID-ul (NameIdentifier)
            var claim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Îl returnează ca int
            return int.Parse(claim);
        }
    }
}