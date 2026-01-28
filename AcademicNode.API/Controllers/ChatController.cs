using AcademicNode.API.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace AcademicNode.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        [HttpPost("ask")]
        public IActionResult AskAI([FromBody] ChatDto chatDto)
        {
            // Curatam mesajul: litere mici + fara spatii inutile la capete
            var msg = chatDto.Message.ToLower().Trim();

            string botResponse = "";
            string actionCode = "";

            // =========================================================
            // 1. INTRODUCERE & SOCIALIZARE
            // =========================================================
            if (msg.Contains("salut") || msg.Contains("buna") || msg.Contains("hello") || msg.Contains("neata"))
            {
                botResponse = "Salutare! Sunt AcademiAI 🤖. Cu ce te pot ajuta astăzi?";
            }
            else if (msg.Contains("ce faci") || msg.Contains("cf") || msg.Contains("ce mai zici"))
            {
                botResponse = "Analizez date și aștept comenzi! Cu ce te pot ajuta?";
            }
            else if (msg.Contains("multumesc") || msg.Contains("mersi"))
            {
                botResponse = "Cu mare plăcere! Oricând ai nevoie.";
            }

            // =========================================================
            // 2. DESPRE APLICATIE & NAVIGARE
            // =========================================================
            else if (msg.Contains("despre") || msg.Contains("ce e asta") || msg.Contains("aplicatia"))
            {
                botResponse = "AcademicNode este rețeaua socială pentru studenți și profesioniști. Poți să-ți faci CV-ul, să postezi și să găsești colegi.";
            }
            else if (msg.Contains("acasa") || msg.Contains("home") || msg.Contains("feed"))
            {
                botResponse = "Te duc la pagina principală unde poți vedea postările recente.";
                actionCode = "nav_home";
            }
            else if (msg.Contains("nu merge sa postez") || msg.Contains("postez"))
            {
                botResponse = "Trebuie sa te autentifici sau sa îți creezi cont și o să poți posta.";
            }
            // =========================================================
            // 3. LEGAT DE PROFIL & CV (Proiecte, Studii, Poza)
            // =========================================================
            else if (msg.Contains("experienta") || msg.Contains("job") || msg.Contains("lucru") || msg.Contains("munca"))
            {
                botResponse = "Experiența se adaugă din Profil -> Butonul 'Editează Profil'. Te duc acolo acum!";
                actionCode = "nav_profile";
            }
            else if (msg.Contains("proiect") || msg.Contains("github") || msg.Contains("portofoliu"))
            {
                botResponse = "Îți poți prezenta proiectele pe profil. Hai să mergem să le vedem/adăugăm.";
                actionCode = "nav_profile";
            }
            else if (msg.Contains("studii") || msg.Contains("educatie") || msg.Contains("facultate") || msg.Contains("scoala"))
            {
                botResponse = "Educația este esențială! O poți gestiona din pagina ta de profil.";
                actionCode = "nav_profile";
            }
            else if (msg.Contains("poza") || msg.Contains("avatar") || msg.Contains("imagine"))
            {
                botResponse = "Poți să îți schimbi poza de profil apăsând pe butonul albastru de lângă avatarul tău actual.";
                actionCode = "nav_profile";
            }
            else if (msg.Contains("profil") || msg.Contains("cv") || msg.Contains("cont"))
            {
                botResponse = "Deschid profilul tău imediat.";
                actionCode = "nav_profile";
            }

            // =========================================================
            // 4. SOCIAL & POSTARI
            // =========================================================
           
            else if (msg.Contains("postez") || msg.Contains("scriu") || msg.Contains("postare"))
            {
                botResponse = "Poți crea o postare nouă direct de pe pagina principală (Feed).";
                actionCode = "nav_home";
            }
          

            // =========================================================
            // 5. TEHNIC & FUN (Easter Eggs)
            // =========================================================
            else if (msg.Contains("gluma") || msg.Contains("vic") || msg.Contains("rade"))
            {
                botResponse = "De ce programatorii preferă întunericul? Pentru că lumina atrage bug-uri! 😂";
            }
            else if (msg.Contains("ha") || msg.Contains("buna gluma"))
            {
                botResponse = "Mă bucur ca ți-a plăcut gluma 😁";
            }
            else if (msg.Contains("logout") || msg.Contains("iesire") || msg.Contains("delogare"))
            {
                botResponse = "Butonul de Logout se află în meniul de sus, în dreapta. Te aștept înapoi!";
            }
            else if (msg.Contains("bug") || msg.Contains("eroare") || msg.Contains("nu merge"))
            {
                botResponse = "Îmi pare rău! 😭 Te rog să contactezi administratorul la mazilumihai79@gmailcom.";
            }
            else if (msg.Contains("creat") || msg.Contains("cine te-a facut"))
            {
                botResponse = "Am fost creat de un dezvoltator priceput pe nume Mazilu Mihai 😎";
            }

            // =========================================================
            // 6. DEFAULT (Nu a inteles)
            // =========================================================
            else
            {
                botResponse = "Hmm, nu sunt sigur. Încearcă să mă întrebi de 'profil', 'colegi', 'proiecte' sau cere-mi o 'glumă'!";
            }

            return Ok(new { response = botResponse, action = actionCode });
        }
    }
}