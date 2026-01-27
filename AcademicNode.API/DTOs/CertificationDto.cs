using System;

namespace AcademicNode.API.DTOs
{
    public class CertificationDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Issuer { get; set; } // Cine a emis certificarea
        public DateTime DateIssued { get; set; }
    }
}