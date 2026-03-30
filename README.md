🚀 AcademicNode - Sistem de Socializare Academică
AcademicNode este o platformă web modernă concepută pentru interacțiunea între studenți și profesori, oferind funcționalități avansate de profil, sistem de urmărire (Follow/Unfollow) și partajare de conținut.

🛠️ Tehnologii Utilizate
Backend: .NET 8 Web API, Entity Framework Core, SQLite/SQL Server.

Frontend: Angular 17+, PrimeNG, TailwindCSS/PrimeFlex.

Autentificare: JWT (JSON Web Tokens).

🏁 Instrucțiuni de Pornire (Ghid Rapid)
Urmează acești pași pentru a rula aplicația local pe calculatorul tău.

1. Pre-cerințe
Asigură-te că ai instalate următoarele:

.NET 8 SDK

Node.js (versiunea LTS)

Angular CLI (npm install -g @angular/cli)

🖥️ Pasul 2: Pornirea Backend-ului (API)
Deschide un terminal în folderul serverului:

Bash
cd AcademicNode.API
Restaurarea pachetelor NuGet:

Bash
dotnet restore
Actualizarea bazei de date (Migrations):

Bash
dotnet ef database update
Rularea serverului:

Bash
dotnet run
Notă: Serverul va porni implicit pe http://localhost:5160.

🎨 Pasul 3: Pornirea Frontend-ului (Angular)
Deschide un terminal nou în folderul de client:

Bash
cd AcademicNode.UI
Instalarea dependențelor (doar prima dată):

Bash
npm install
Pornirea aplicației:

Bash
ng serve -o
Notă: Aplicația se va deschide automat în browser la adresa http://localhost:4200.

✨ Funcționalități Implementate Recent
Sistem Follow/Unfollow: Posibilitatea de a urmări alți utilizatori cu actualizare în timp real.

Interfață Stil Instagram: Afișarea numărului de urmăritori și a persoanelor urmărite direct pe profil.

Tabele Interactive: Liste detaliate cu utilizatori (Followers/Following) cu funcție de "teleportare" (navigare) pe profilul acestora.

Gestionare Poze: Afișarea automată a pozelor de profil în liste, cu fallback la iconițe în caz de eroare.

Design Responsive: Optimizare completă pentru desktop și dispozitive mobile.

📂 Structura Proiectului
/API - Logica de business, controllerele și contextul bazei de date.

/Client - Componentele Angular, serviciile API și stilizarea CSS/PrimeNG.

/Infrastructure - Migrări și configurații pentru baza de date.

📝 Notă pentru Dezvoltatori
Dacă întâmpinați erori de tip 401 Unauthorized la încărcarea listelor, asigurați-vă că sunteți autentificat (token-ul JWT trebuie să fie prezent în LocalStorage).