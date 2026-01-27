using System;

namespace AcademicNode.API.DTOs
{
    public class ExperienceDto
    {
        public int Id { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Null daca lucreaza in prezent
    }
}