using System.ComponentModel.DataAnnotations.Schema;

namespace AcademicNode.API.Entities
{
    [Table("Posts")]
    public class Post
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- SCHIMBARE CRITICĂ ---
        // ID-ul userului trebuie sa fie INT (ca in AppUser)
        // Il numim AppUserId ca sa fie clar
        public int AppUserId { get; set; }

        // Proprietatea de navigare
        public AppUser AppUser { get; set; }

        // Lista de like-uri
        public List<PostLike> Likes { get; set; } = new List<PostLike>();
    }
}