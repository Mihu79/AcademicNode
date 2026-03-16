import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ChatbotComponent } from './components/chatbot/chatbot';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenubarModule, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'AcademicNode.UI';
  private router = inject(Router);

  items: MenuItem[] | undefined;

  ngOnInit() {
    // 1. Initializam meniul prima data
    this.updateMenu();

    // 2. ASCULTAM SCHIMBARILE DE PAGINA
    // De fiecare data cand navighezi, verificam daca esti logat sau nu
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateMenu();
      }
    });
  }

  updateMenu() {
    const userString = localStorage.getItem('user');
    const isLoggedIn = userString !== null;

    if (isLoggedIn) {
      const user = JSON.parse(userString);

      // 1. EXTRAGEM ROLUL DIRECT DIN TOKEN (Asta garanteaza ca merge)
      let isAdmin = false;
      if (user.token) {
        // Spargem token-ul si citim partea din mijloc (payload-ul)
        const payload = JSON.parse(atob(user.token.split('.')[1]));
        const roles = payload.role; // In JWT-ul de C#, rolurile sunt mereu in "role"

        if (roles) {
          // Daca are un singur rol e string, daca are mai multe e array. Il facem mereu array.
          const rolesArray = Array.isArray(roles) ? roles : [roles];
          isAdmin = rolesArray.includes('Admin');
        }
      }

      // 2. Cream lista de baza (ce vede orice utilizator logat)
      const loggedInItems: MenuItem[] = [
        {
          label: 'Acasă (Feed)',
          icon: 'pi pi-home',
          command: () => this.router.navigate(['/'])
        }
      ];

      // 3. ADAUGAM BUTONUL DE ADMIN DOAR DACA ARE ROLUL
      if (isAdmin) {
        loggedInItems.push({
          label: 'Panou Admin',
          icon: 'pi pi-shield',
          command: () => this.router.navigate(['/admin'])
        });
      }

      // 4. Punem butonul de Logout la final
      loggedInItems.push({
        label: 'Ieșire Cont',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      });

      this.items = loggedInItems;

    } else {
      // --- MENU PENTRU VIZITATOR (NELOGAT) ---
      this.items = [
        {
          label: 'Autentificare',
          icon: 'pi pi-user',
          command: () => this.router.navigate(['/login'])
        },
        {
          label: 'Înregistrare',
          icon: 'pi pi-user-plus',
          command: () => this.router.navigate(['/register'])
        }
      ];
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
    // updateMenu se va apela automat datorita abonamentului din ngOnInit
  }
}
