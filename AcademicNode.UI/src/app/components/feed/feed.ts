import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, RouterModule, ButtonModule, DialogModule, InputTextModule, TooltipModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {
  private apiService = inject(ApiService);

  // --- MODIFICARE 1: Doua liste in loc de una ---
  allPosts: any[] = [];      // Lista completa (Backup)
  visiblePosts: any[] = [];  // Lista care se afiseaza pe ecran
  searchText: string = '';   // Textul din bara de cautare
  // ---------------------------------------------

  visible: boolean = false;
  isEditMode: boolean = false;

  // Variabile pentru Editare/Creare
  currentPostId: number | null = null;
  currentUser: any = null;
  postData: any = { title: '', content: '' };

  // --- VARIABILE PENTRU FISIER SI PREVIEW ---
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  // URL-ul de baza pentru poze (Backend)
  baseUrl = 'http://localhost:5160/';

  ngOnInit() {
    // 1. Luam valoarea din memorie
    const userString = localStorage.getItem('user');

    // 2. VERIFICARE STRICTA:
    // Daca exista ceva, DAR nu este textul "undefined" si nici "null"
    if (userString && userString !== 'undefined' && userString !== 'null') {
      try {
        this.currentUser = JSON.parse(userString);
      } catch (e) {
        console.error("Date corupte in LocalStorage. Se sterg...");
        localStorage.removeItem('user');
        this.currentUser = null;
      }
    } else {
      // Daca e gol sau scrie "undefined", consideram ca nu e logat
      this.currentUser = null;
    }

    this.loadPosts();
  }
  
  loadPosts() {
    this.apiService.getPosts().subscribe({
      next: (data: any) => {
        this.allPosts = data;       // Salvam totul in backup
        this.filterPosts();         // Initializam lista vizibila
      },
      error: (err: any) => console.error('Eroare incarcare postari:', err)
    });
  }

  filterPosts() {
    if (!this.searchText || this.searchText.trim() === '') {
      // Daca nu e scris nimic, aratam tot
      this.visiblePosts = [...this.allPosts];
    } else {
      // Filtram dupa Titlu SAU Nume Autor
      const term = this.searchText.toLowerCase();
      this.visiblePosts = this.allPosts.filter(post =>
        post.title.toLowerCase().includes(term) ||
        (post.appUser?.userName || '').toLowerCase().includes(term)
      );
    }
  }
  // ----------------------------------------

  showAddDialog() {
    this.isEditMode = false;
    this.postData = { title: '', content: '' };
    this.selectedFile = null;
    this.previewUrl = null;
    this.visible = true;
  }

  showEditDialog(post: any) {
    this.isEditMode = true;
    this.currentPostId = post.id;
    this.postData = { title: post.title, content: post.content };
    this.selectedFile = null;
    this.previewUrl = null;
    this.visible = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  submitPost() {
    if (!this.currentUser) {
      alert("Trebuie să te autentifici!");
      return;
    }

    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('content', this.postData.content);

    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    if (this.isEditMode) {
      this.apiService.updatePost(this.currentPostId!, formData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts();
        },
        error: (err: any) => alert("Eroare la editare!")
      });
    } else {
      this.apiService.createPost(formData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts();
        },
        error: (err: any) => {
          console.error(err);
          alert("Eroare la creare postare!");
        }
      });
    }
  }

  getPhotoUrl(path: string): string {
    if (!path) return '';
    return this.baseUrl + path.replace(/\\/g, '/');
  }

  isLiked(post: any): boolean {
    if (!this.currentUser || !post.likes) return false;
    return post.likes.some((like: any) => like.sourceUserId === this.currentUser.id);
  }

  toggleLike(post: any) {
    if (!this.currentUser) return;
    const alreadyLiked = this.isLiked(post);

    this.apiService.likePost(post.id).subscribe({
      next: () => {
        if (alreadyLiked) {
          post.likes = post.likes.filter((l: any) => l.sourceUserId !== this.currentUser.id);
        } else {
          if (!post.comments) post.comments = [];
          if (!post.likes) post.likes = [];

          post.likes.push({
            sourceUserId: this.currentUser.id,
            targetPostId: post.id
          });
        }
      },
      error: () => alert("Eroare like")
    });
  }

  deletePost(id: number) {
    if (confirm("Sigur ștergi?")) {
      this.apiService.deletePost(id).subscribe({
        next: () => this.loadPosts(),
        error: () => alert("Eroare ștergere")
      });
    }
  }

  toggleComments(post: any) {
    post.showComments = !post.showComments;
  }

  submitComment(post: any) {
    if (!this.currentUser) return;
    if (!post.newCommentText || post.newCommentText.trim() === '') return;

    this.apiService.addComment(post.id, post.newCommentText).subscribe({
      next: (newComment: any) => {
        if (!post.comments) {
          post.comments = [];
        }
        post.comments.push(newComment);
        post.newCommentText = '';
      },
      error: () => alert("Eroare la adăugare comentariu")
    });
  }
}
