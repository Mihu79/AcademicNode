import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api';
import { Member } from '../../models/member';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css'
})
export class MemberDetailComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);

  editVisible: boolean = false;
  member: Member | undefined;
  currentUser: any = null;

  ngOnInit(): void {
    const userString = localStorage.getItem('user');
    if (userString) {
      this.currentUser = JSON.parse(userString);
    }

    this.loadMember();
  }

  loadMember() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) return;

    this.apiService.getMember(username).subscribe({
      next: (member) => {
        this.member = member;

        // --- MODIFICARE AICI: Folosim (this.apiService as any) ---
        if (this.member.photoUrl && !this.member.photoUrl.startsWith('http')) {
          // "pacalim" typescript-ul sa ne lase sa citim baseUrl
          const serverUrl = (this.apiService as any).baseUrl.replace('/api', '');
          this.member.photoUrl = serverUrl + '/' + this.member.photoUrl;
        }
        // ---------------------------------------------------------
      },
      error: (err) => console.error(err)
    })
  }

  showEditDialog() {
    this.editVisible = true;
  }

  updateProfile() {
    if (!this.member) return;

    this.apiService.updateMember(this.member).subscribe({
      next: () => {
        alert("Profil actualizat cu succes!");
        this.editVisible = false;
      },
      error: (err) => alert("Eroare la actualizare")
    });
  }

  onPhotoSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.apiService.uploadProfilePhoto(file).subscribe({
        next: (response: any) => {

          // --- MODIFICARE AICI: Folosim (this.apiService as any) ---
          const serverUrl = (this.apiService as any).baseUrl.replace('/api', '');
          const fullUrl = serverUrl + '/' + response.url;

          if (this.member) {
            this.member.photoUrl = fullUrl;
          }

          if (this.currentUser) {
            this.currentUser.photoUrl = fullUrl;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
          }

          alert("Poza de profil a fost actualizată!");
        },
        error: (err) => alert("Eroare la încărcarea pozei")
      });
    }
  }
}
