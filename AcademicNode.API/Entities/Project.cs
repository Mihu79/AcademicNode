namespace AcademicNode.API.Entities
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string GithubLink { get; set; } // Link catre repo
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
    }
}