import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Asigura-te ca aceasta cale este corecta pentru proiectul tau
import { ApiService } from '../../services/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, DialogModule, InputTextModule, TooltipModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css'
})
export class FeedComponent implements OnInit {
  private apiService = inject(ApiService);

  posts: any[] = [];
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
    const userString = localStorage.getItem('user');
    if (userString) {
      this.currentUser = JSON.parse(userString);
    }
    this.loadPosts();
  }

  loadPosts() {
    this.apiService.getPosts().subscribe({
      next: (data: any) => this.posts = data,
      error: (err: any) => console.error('Eroare incarcare postari:', err)
    });
  }

  showAddDialog() {
    this.isEditMode = false;
    this.postData = { title: '', content: '' };
    this.selectedFile = null;
    this.previewUrl = null; // Resetam preview-ul
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

  // --- FUNCTIE ACTUALIZATA: Citeste fisierul si face Preview ---
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Logica pentru Preview
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

    // --- CONSTRUIM FORMULARUL (FORM DATA) PENTRU AMBELE CAZURI ---
    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('content', this.postData.content);

    // Daca avem fisier selectat, il punem (valabil si la editare daca vrei pe viitor)
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }
    // -------------------------------------------------------------

    if (this.isEditMode) {
      // EDITARE - Trimitem formData in loc de JSON simplu
      this.apiService.updatePost(this.currentPostId!, formData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts();
        },
        error: (err: any) => alert("Eroare la editare!")
      });
    } else {
      // CREARE
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

    // 1. Verificam daca userul a dat deja like inainte sa trimitem cererea
    const alreadyLiked = this.isLiked(post);

    this.apiService.likePost(post.id).subscribe({
      next: () => {
        // --- AICI E SCHIMBAREA ---
        // NU mai apelam this.loadPosts();

        if (alreadyLiked) {
          // CAZUL UNLIKE: Scoatem like-ul nostru din lista locala
          post.likes = post.likes.filter((l: any) => l.sourceUserId !== this.currentUser.id);
        } else {
          // CAZUL LIKE: Adaugam un like "fals" in lista locala ca sa se vada imediat
          // Verificam sa existe array-ul, daca e null il cream
          if (!post.comments) post.comments = [];
          if (!post.likes) post.likes = [];

          post.likes.push({
            sourceUserId: this.currentUser.id,
            targetPostId: post.id
          });
        }
        // -------------------------
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
        // Adaugam comentariul in lista postarii fara sa dam refresh la toata pagina
        if (!post.comments) {
          post.comments = [];
        }
        post.comments.push(newComment);

        // Resetam campul de text
        post.newCommentText = '';
      },
      error: () => alert("Eroare la adăugare comentariu")
    });
  }
}
