namespace AcademicNode.API.Entities;

public class UserFollow
{
    public int SourceUserId { get; set; } // Cel care dă follow
    public AppUser SourceUser { get; set; }

    public int TargetUserId { get; set; } // Cel care primește follow-ul
    public AppUser TargetUser { get; set; }
}