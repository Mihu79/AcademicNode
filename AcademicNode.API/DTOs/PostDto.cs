using Microsoft.AspNetCore.Http;

namespace AcademicNode.API.DTOs
{
    public class PostDto
    {
        public string Title { get; set; }
        public string Content { get; set; }

        public IFormFile File { get; set; }
    }
}