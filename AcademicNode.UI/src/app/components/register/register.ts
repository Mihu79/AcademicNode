import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router'; // RouterLink pt butonul "Ai deja cont?"
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, PasswordModule, ButtonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  api = inject(ApiService);
  router = inject(Router);

  // Modelul trebuie sa se potriveasca cu RegisterDto din C#
  model: any = {
    username: '',
    email: '',
    password: ''
  };

  register() {
    console.log("Date trimise:", this.model);

    this.api.register(this.model).subscribe({
      next: (response) => {
        console.log("Inregistrare reusita!");
        alert("Cont creat cu succes! Acum te poți loga.");
        // Dupa ce s-a inregistrat, il trimitem la Login
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error(error);
        alert("Ceva nu a mers. Verifică dacă userul există deja.");
      }
    })
  }
}
