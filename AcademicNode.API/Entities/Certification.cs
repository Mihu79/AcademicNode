namespace AcademicNode.API.Entities
{
    public class Certification
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Issuer { get; set; } // Cine a emis (ex: Microsoft)
        public DateTime DateIssued { get; set; }

        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
    }
}