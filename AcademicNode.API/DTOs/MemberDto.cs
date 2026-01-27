namespace AcademicNode.API.DTOs
{
    public class MemberDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PhotoUrl { get; set; }

        // Informatii Profil
        public int Age { get; set; } // Vom calcula varsta automat
        public string KnownAs { get; set; }
        public DateTime Created { get; set; }
        public DateTime LastActive { get; set; }
        public string Gender { get; set; }
        public string Introduction { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        // Adauga proprietatile astea in MemberDto
        public ICollection<EducationDto> Educations { get; set; }
        public ICollection<ExperienceDto> Experiences { get; set; }
        public ICollection<ProjectDto> Projects { get; set; }
        public ICollection<CertificationDto> Certifications { get; set; }
    }
}