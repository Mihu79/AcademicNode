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

        public string PhotoUrl { get; set; }
        public int AppUserId { get; set; }

        public AppUser AppUser { get; set; }

        
        public List<PostLike> Likes { get; set; } = new List<PostLike>();
    }
}