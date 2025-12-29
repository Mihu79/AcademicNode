using System.ComponentModel.DataAnnotations;

namespace AcademicNode.API.DTOs
{
    public class CreateCommentDto
    {
        [Required] // Ne asiguram ca nu trimite text gol
        public string Content { get; set; }
    }
}