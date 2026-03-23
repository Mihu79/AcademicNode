import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, PasswordModule, ButtonModule],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  api = inject(ApiService);

  email: string = '';
  token: string = '';
  newPassword: string = '';

  ngOnInit() {
    // Extragem datele magice (email si token) din link-ul pe care a dat click!
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      this.token = params['token'];
    });
  }

  submitNewPassword() {
    if (!this.newPassword) {
      alert('Te rog introdu o parolă nouă!');
      return;
    }

    // Construim cutia cu date pentru C# (exact cum le asteapta DTO-ul tau)
    const data = {
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    };

    // Trimitem la server
    this.api.resetPassword(data).subscribe({
      next: (res: any) => {
        alert('Parola a fost schimbată cu succes! Te poți loga acum cu noua parolă.');
        this.router.navigate(['/login']); // Il trimitem la login
      },
      error: (err: any) => {
        alert('Eroare! Link-ul este invalid, modificat sau a expirat.');
      }
    });
  }
}
