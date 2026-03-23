import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog'; // NOU: Am importat DialogModule pentru popup
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  // NOU: Am adaugat DialogModule in lista de imports de mai jos
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, DialogModule],
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

  // --- NOU: Variabile pentru Resetarea Parolei ---
  forgotPasswordVisible: boolean = false;
  forgotPasswordEmail: string = '';

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

  // --- NOU: Deschide fereastra popup ---
  showForgotPasswordDialog() {
    this.forgotPasswordEmail = '';
    this.forgotPasswordVisible = true;
  }

  // --- NOU: Trimite cererea de email catre backend ---
  submitForgotPassword() {
    if (!this.forgotPasswordEmail || this.forgotPasswordEmail.trim() === '') {
      alert("Te rog să introduci o adresă de email validă!");
      return;
    }

    // Apelam functia forgotPassword din ApiService
    this.api.forgotPassword(this.forgotPasswordEmail).subscribe({
      next: (res: any) => {
        alert(res.message || "Dacă emailul există în sistem, am trimis un link. Verifică Mailtrap!");
        this.forgotPasswordVisible = false; // Inchidem fereastra
      },
      error: (err: any) => {
        alert("A apărut o eroare la trimiterea email-ului.");
      }
    });
  }
}
