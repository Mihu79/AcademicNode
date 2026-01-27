using AcademicNode.API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AcademicNode.API.Data
{
    // Aceasta este linia magică ce rezolvă eroarea CS0311
    // Îi spunem: Userul e AppUser, Rolul e AppRole, și Cheia e int
    public class DataContext : IdentityDbContext<AppUser, AppRole, int>
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        // NU mai scrie: public DbSet<AppUser> Users { get; set; } -> E deja inclus în IdentityDbContext

        public DbSet<Post> Posts { get; set; }
        public DbSet<PostLike> Likes { get; set; }
        public DbSet<Comment> Comments { get; set; }
        // ... in DataContext : DbContext
        public DbSet<Education> Educations { get; set; }
        public DbSet<Experience> Experiences { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Certification> Certifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 1. User - Roles
            builder.Entity<AppUser>()
                .HasMany(ur => ur.UserRoles)
                .WithOne(u => u.User)
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            builder.Entity<AppRole>()
                .HasMany(ur => ur.UserRoles)
                .WithOne(u => u.Role)
                .HasForeignKey(ur => ur.RoleId)
                .IsRequired();

            // 2. User - Posts
            builder.Entity<Post>()
                .HasOne(p => p.AppUser)
                .WithMany(u => u.Posts)
                .HasForeignKey(p => p.AppUserId)
                .OnDelete(DeleteBehavior.Cascade); // Ștergem Userul -> Se șterg Postările (OK)

            // 3. Likes
            builder.Entity<PostLike>()
                .HasKey(k => new { k.SourceUserId, k.TargetPostId });

            builder.Entity<Comment>()
                .HasOne(c => c.AppUser)
                .WithMany() // Userul are multe comentarii (chiar daca nu am pus lista in AppUser)
                .HasForeignKey(c => c.AppUserId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- AICI ESTE FIX-UL ---
            builder.Entity<PostLike>()
                .HasOne(s => s.SourceUser)
                .WithMany(l => l.LikedPosts)
                .HasForeignKey(s => s.SourceUserId)
                .OnDelete(DeleteBehavior.NoAction); // <--- SCHIMBAT DIN Cascade IN NoAction
                                                    // Asta inseamna: Daca stergem Userul, SQL Server NU va incerca sa sterga Like-urile automat pe calea asta,
                                                    // evitand astfel conflictul cu calea User -> Post -> Like.

            builder.Entity<PostLike>()
                .HasOne(s => s.TargetPost)
                .WithMany(l => l.Likes)
                .HasForeignKey(s => s.TargetPostId)
                .OnDelete(DeleteBehavior.Cascade); // Ștergem Postarea -> Se șterg Like-urile ei (OK)
        }
    }
}