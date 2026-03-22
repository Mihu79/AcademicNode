using Microsoft.AspNetCore.Http;

namespace AcademicNode.API.Services
{
    public class FileService
    {
        private readonly IWebHostEnvironment _environment;
        public FileService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<string> SaveFileAsync(IFormFile file)
        {
            // 1. Stabilim unde e folderul wwwroot/files
            string wwwRootPath = _environment.WebRootPath;
            string fileName = Guid.NewGuid().ToString() + "_" + file.FileName; // Nume unic: id_curs.pdf
            string path = Path.Combine(wwwRootPath, "files", fileName);

            // 2. Salvam fizic fisierul
            using (var fileStream = new FileStream(path, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // 3. Returnam URL-ul pe care il va folosi Angular (ex: /files/id_curs.pdf)
            return "/files/" + fileName;
        }
    }
}