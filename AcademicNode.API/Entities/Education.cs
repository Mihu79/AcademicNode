namespace AcademicNode.API.Entities
{
    public class Education
    {
        public int Id { get; set; }
        public string School { get; set; } // Numele institutiei
        public string Degree { get; set; } // Diploma (ex: Licenta)
        public string FieldOfStudy { get; set; } // Domeniu
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; } // Poate fi null daca e in curs

        // Relatie cu Userul
        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
    }
}