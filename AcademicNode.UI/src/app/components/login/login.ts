import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Modulul pentru formulare
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  // Importam piesele vizuale necesare
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  api = inject(ApiService);
  router = inject(Router);

  // Aici vom stoca ce scrie utilizatorul
  model: any = {
    email: '',
    password: ''
  };

  // Functia care se apeleaza cand dai click pe buton
  login() {
    // 1. Apelam API-ul
    this.api.login(this.model).subscribe({

      // CAZUL FERICIT (Serverul a zis DA)
      next: (response: any) => {
        console.log("Login reușit!", response);

        // 2. Salvam "biletul de intrare" (Token-ul) in buzunarul browserului (LocalStorage)
        localStorage.setItem('user', JSON.stringify(response));

        // 3. Ne mutam automat pe pagina principala (Feed)
        this.router.navigate(['/']);
      },

      // CAZUL NEFERICIT (Parola gresita / Cont inexistent)
      error: (error) => {
        console.error(error);
        alert("Eroare! Verifică email-ul sau parola.");
      }
    });
  }
}
