import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TooltipModule],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css']
})
export class PostCardComponent {
  private apiService = inject(ApiService);

  // Primim datele de la pagina parinte (Feed sau Profile)
  @Input() post: any;
  @Input() currentUser: any;
  @Input() userRoles: string[] = [];

  // Trimitem semnale inapoi catre pagina parinte daca vrem sa editam/stergem
  @Output() edit = new EventEmitter<any>();
  @Output() delete = new EventEmitter<number>();

  baseUrl = 'http://localhost:5160/';

  // --- LOGICA DE AFISARE ---
  getFileUrl(path: string): string {
    if (!path) return '';
    const formattedPath = path.startsWith('/') ? path : '/' + path;
    return this.baseUrl + formattedPath.replace(/\\/g, '/');
  }

  isProfessor(): boolean {
    if (!this.post.appUser || !this.post.appUser.userRoles) return false;
    return this.post.appUser.userRoles.some((ur: any) => ur.role?.name === 'Professor');
  }

  canEditOrDelete(): boolean {
    if (!this.currentUser) return false;
    const isAuthor = this.currentUser.id === this.post.appUserId;
    const isAdmin = this.userRoles.includes('Admin');
    return isAuthor || isAdmin;
  }

  canInteract(): boolean {
    if (!this.currentUser) return false;
    return this.userRoles.includes('Student') || this.userRoles.includes('Professor') || this.userRoles.includes('Admin');
  }

  // --- LOGICA DE INTERACTIUNE (Acum e 100% autonoma) ---
  isLiked(): boolean {
    if (!this.currentUser || !this.post.likes) return false;
    return this.post.likes.some((like: any) => like.sourceUserId === this.currentUser.id);
  }

  toggleLike() {
    if (!this.currentUser) return;
    const alreadyLiked = this.isLiked();

    this.apiService.likePost(this.post.id).subscribe({
      next: () => {
        if (alreadyLiked) {
          this.post.likes = this.post.likes.filter((l: any) => l.sourceUserId !== this.currentUser.id);
        } else {
          if (!this.post.comments) this.post.comments = [];
          if (!this.post.likes) this.post.likes = [];
          this.post.likes.push({ sourceUserId: this.currentUser.id, targetPostId: this.post.id });
        }
      },
      error: () => alert("Eroare like")
    });
  }

  toggleComments() {
    this.post.showComments = !this.post.showComments;
  }

  submitComment() {
    if (!this.currentUser) return;
    if (!this.post.newCommentText || this.post.newCommentText.trim() === '') return;

    this.apiService.addComment(this.post.id, this.post.newCommentText).subscribe({
      next: (newComment: any) => {
        if (!this.post.comments) this.post.comments = [];
        this.post.comments.push(newComment);
        this.post.newCommentText = '';
      },
      error: () => alert("Eroare la adăugare comentariu")
    });
  }

  // Cand utilizatorul da click pe Edit/Delete, anuntam pagina parinte (Feed sau Profil)
  onEditClick() {
    this.edit.emit(this.post);
  }

  onDeleteClick() {
    this.delete.emit(this.post.id);
  }
}
