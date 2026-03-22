namespace AcademicNode.API.DTOs
{
    public class CreateRoleRequestDto
    {
        public string RequestedRole { get; set; } // "Student" sau "Professor"
        public string Message { get; set; }
    }
}