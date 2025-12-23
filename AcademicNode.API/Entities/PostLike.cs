namespace AcademicNode.API.Entities
{
    public class PostLike
    {
        // ID-ul utilizatorului care dă like
        public int SourceUserId { get; set; }
        public AppUser SourceUser { get; set; }

        // ID-ul postării care primește like
        public int TargetPostId { get; set; }
        public Post TargetPost { get; set; }
    }
}