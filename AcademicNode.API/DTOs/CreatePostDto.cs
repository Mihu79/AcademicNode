namespace AcademicNode.API.DTOs
{
    public class CreatePostDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string UserId { get; set; } // Primim ID-ul userului care posteaza
        public int LikesCount { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
    }
}