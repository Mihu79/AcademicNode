using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AcademicNode.API.Entities
{
    public class RoleRequest
    {
        public int Id { get; set; }

        // Legătura cu utilizatorul care face cererea
        public int AppUserId { get; set; }
        [ForeignKey("AppUserId")]
        public AppUser AppUser { get; set; }

        [Required]
        public string RequestedRole { get; set; } // Aici vom salva "Student" sau "Professor"

        public string Message { get; set; } // Mesajul justificativ (ex: "Sunt la grupa 105")

        public string Status { get; set; } = "Pending"; // Poate fi: Pending, Approved, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}