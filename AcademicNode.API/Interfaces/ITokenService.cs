using AcademicNode.API.Entities;

namespace AcademicNode.API.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(AppUser user);
    }
}