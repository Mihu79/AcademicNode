import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// --- ATENTIE AICI LA IMPORT ---
// Daca fisierul tau fizic se numeste "api.ts", lasa linia de mai jos asa:
import { ApiService } from '../../services/api';
// Daca fisierul tau fizic se numeste "api.service.ts", pune: from '../../services/api.service';
// ------------------------------
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
  currentPostId: number | null = null;
  currentUser: any = null;

  postData: any = { title: '', content: '' };

  ngOnInit() {
    const userString = localStorage.getItem('user');
    if (userString) {
      this.currentUser = JSON.parse(userString);
    }
    this.loadPosts();
  }

  loadPosts() {
    // Am adaugat tipul : any la 'data' si 'err'
    this.apiService.getPosts().subscribe({
      next: (data: any) => this.posts = data,
      error: (err: any) => console.error('Eroare incarcare postari:', err)
    });
  }

  showAddDialog() {
    this.isEditMode = false;
    this.postData = { title: '', content: '' };
    this.visible = true;
  }

  showEditDialog(post: any) {
    this.isEditMode = true;
    this.currentPostId = post.id;
    this.postData = { title: post.title, content: post.content };
    this.visible = true;
  }

  submitPost() {
    if (!this.currentUser) {
      alert("Trebuie să te autentifici pentru a posta!");
      return;
    }

    if (this.isEditMode) {
      // Am adaugat tipul : any la err
      this.apiService.updatePost(this.currentPostId!, this.postData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts();
        },
        error: (err: any) => {
          console.error(err);
          alert("Eroare la editare!");
        }
      });

    } else {
      // Am adaugat tipul : any la err
      this.apiService.createPost(this.postData).subscribe({
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

  isLiked(post: any): boolean {
    if (!this.currentUser || !post.likes) return false;
    return post.likes.some((like: any) => like.sourceUserId === this.currentUser.id);
  }

  toggleLike(post: any) {
    if (!this.currentUser) {
      alert("Trebuie sa fii logat!");
      return;
    }

    // Am adaugat tipul : any la err
    this.apiService.likePost(post.id).subscribe({
      next: () => {
        this.loadPosts();
      },
      error: (err: any) => {
        console.error('Eroare la like', err);
        alert("Nu am putut da like.");
      }
    });
  }

  deletePost(id: number) {
    if (confirm("Sigur vrei să ștergi postarea?")) {
      this.apiService.deletePost(id).subscribe({
        next: () => this.loadPosts(),
        error: () => alert("Eroare la stergere")
      });
    }
  }
}
