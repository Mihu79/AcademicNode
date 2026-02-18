using AcademicNode.API.DTOs;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AcademicNode.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public ChatController(IConfiguration config)
        {
            _config = config;
            _httpClient = new HttpClient();
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskAI([FromBody] ChatDto chatDto)
        {
            // 1. Validare API Key
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey)) return BadRequest("API Key lipsă.");

            var userMessage = chatDto.Message;

            // 2. Prompt-ul "Sistem" integrat
            // Ii spunem clar sa raspunda JSON si ce actiuni stie sa faca
            var promptFinal = @$"
                Ești asistentul virtual al platformei AcademicNode.
                Răspunde scurt și util în limba română.
                
                REGULA CRITICĂ: Răspunde DOAR cu un JSON valid, fără alte explicații sau markdown.
                Formatul trebuie să fie exact așa:
                {{ ""response"": ""textul tau aici"", ""action"": ""cod_actiune"" }}

                Coduri acțiune disponibile (folosește-le doar când userul cere navigare):
                - 'nav_profile' (pentru profil, cv, experiență, studii)
                - 'nav_home' (pentru acasă, feed, postări)
                - 'nav_members' (pentru membri, colegi, căutare oameni)
                - 'nav_messages' (pentru chat, mesaje private)
                - '' (lasă gol dacă e doar o discuție normală)

                User: {userMessage}
            ";

            // 3. URL-UL CORECT DIN LISTA TA (Gemini 2.5 Flash)
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = promptFinal } } }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            try
            {
                // 4. Apelam Google
                var response = await _httpClient.PostAsync(url, jsonContent);
                var responseString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    // Daca totusi crapa, vedem eroarea in consola
                    Console.WriteLine($"[DEBUG] EROARE: {responseString}");
                    return StatusCode((int)response.StatusCode, "Google Error");
                }

                // 5. Parsam raspunsul
                using var doc = JsonDocument.Parse(responseString);
                var candidates = doc.RootElement.GetProperty("candidates");

                if (candidates.GetArrayLength() == 0) return Ok(new { response = "Nu am înțeles.", action = "" });

                var textResponse = candidates[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                // 6. Curatenie (stergem ```json daca apare)
                textResponse = textResponse
                    .Replace("```json", "")
                    .Replace("```", "")
                    .Trim();

                // 7. Returnam JSON catre Frontend
                try
                {
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var aiResult = JsonSerializer.Deserialize<AIResponse>(textResponse, options);
                    return Ok(aiResult);
                }
                catch
                {
                    // Fallback: daca AI-ul a gresit JSON-ul, trimitem textul brut
                    return Ok(new { response = textResponse, action = "" });
                }
            }
            catch (Exception ex)
            {
                return BadRequest("Eroare interna: " + ex.Message);
            }
        }

        public class AIResponse
        {
            [JsonPropertyName("response")]
            public string Response { get; set; }

            [JsonPropertyName("action")]
            public string Action { get; set; }
        }
    }
}