using System;

namespace AcademicNode.API.DTOs
{
    public class EducationDto
    {
        public int Id { get; set; }
        public string School { get; set; }
        public string Degree { get; set; }
        public string FieldOfStudy { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Null daca inca studiaza
    }
}