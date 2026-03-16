using AcademicNode.API.Entities;
using System.Threading.Tasks;

namespace AcademicNode.API.Interfaces
{
    public interface ITokenService
    {
        Task<string> CreateTokenAsync(AppUser user);
    }
}