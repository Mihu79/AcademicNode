namespace AcademicNode.API.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public string Username { get; set; }
        public string UserPhotoUrl { get; set; } // Optional, pe viitor
        public DateTime CreatedAt { get; set; }
    }
}