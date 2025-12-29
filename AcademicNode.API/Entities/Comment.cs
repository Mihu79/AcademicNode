namespace AcademicNode.API.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Relatia cu Postarea (Comentariul apartine unei postari)
        public int PostId { get; set; }
        public Post Post { get; set; }

        // Relatia cu Userul (Cine a scris comentariul)
        public int AppUserId { get; set; }
        public AppUser AppUser { get; set; }
    }
}