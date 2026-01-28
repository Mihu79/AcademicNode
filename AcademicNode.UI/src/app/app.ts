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
    // Verificam daca exista user in memorie
    const isLoggedIn = localStorage.getItem('user') !== null;

    if (isLoggedIn) {
      // --- MENU PENTRU UTILIZATOR LOGAT ---
      this.items = [
        {
          label: 'Acasă (Feed)',
          icon: 'pi pi-home',
          command: () => this.router.navigate(['/'])
        },
        {
          label: 'Ieșire Cont',
          icon: 'pi pi-sign-out',
          command: () => this.logout()
        }
      ];
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
