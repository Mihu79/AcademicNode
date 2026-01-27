namespace AcademicNode.API.Entities
{
    public class Experience
    {
        public int Id { get; set; }
        public string Company { get; set; }
        public string Position { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
    }
}