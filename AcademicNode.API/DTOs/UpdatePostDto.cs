using Microsoft.AspNetCore.Http;

namespace AcademicNode.API.DTOs
{
    public class UpdatePostDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public IFormFile File { get; set; }
    }
}