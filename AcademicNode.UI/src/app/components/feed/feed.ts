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

  allPosts: any[] = [];
  visiblePosts: any[] = [];
  searchText: string = '';

  visible: boolean = false;
  isEditMode: boolean = false;

  currentPostId: number | null = null;
  currentUser: any = null;
  postData: any = { title: '', content: '' };

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isPdfSelected: boolean = false; // ADAUGAT: Pt a sti daca aratam iconita de PDF sau imaginea in preview
  requestDialogVisible: boolean = false;
  requestData: any = { requestedRole: 'Student', message: '' };

  baseUrl = 'http://localhost:5160/';

  // ADAUGAT: Pentru a pastra rolurile userului logat usor de accesat
  userRoles: string[] = [];

  ngOnInit() {
    const userString = localStorage.getItem('user');

    if (userString && userString !== 'undefined' && userString !== 'null') {
      try {
        this.currentUser = JSON.parse(userString);

        // --- ADAUGAT: Extragem rolurile din Token pentru a le folosi la permisiuni ---
        if (this.currentUser.token) {
          const payload = JSON.parse(atob(this.currentUser.token.split('.')[1]));
          const roles = payload.role;
          this.userRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);
        }
      } catch (e) {
        console.error("Date corupte in LocalStorage. Se sterg...");
        localStorage.removeItem('user');
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }

    this.loadPosts();
  }

  // --- NOU: Verifica daca are voie sa posteze (Ascunde butonul pt "Normal") ---
  canPost(): boolean {
    if (!this.currentUser) return false;
    // Daca are rolul 'Normal', NU are voie sa posteze
    if (this.userRoles.includes('Normal')) return false;
    return true;
  }

  // --- NOU: Verifica daca are voie sa stearga/editeze (Autor SAU Admin) ---
  canEditOrDelete(post: any): boolean {
    if (!this.currentUser) return false;
    const isAuthor = this.currentUser.id === post.appUserId;
    const isAdmin = this.userRoles.includes('Admin');
    return isAuthor || isAdmin;
  }

  // --- MODIFICAT: Construim calea pentru fisier (PDF sau Poza) ---
  getFileUrl(path: string): string {
    if (!path) return '';
    // Asiguram ca path-ul are / in fata
    const formattedPath = path.startsWith('/') ? path : '/' + path;
    return this.baseUrl + formattedPath.replace(/\\/g, '/');
  }

  // Se pastreaza pentru imaginile vechi/standard
  getPhotoUrl(path: string): string {
    if (!path) return '';
    const formattedPath = path.startsWith('/') ? path : '/' + path;
    return this.baseUrl + formattedPath.replace(/\\/g, '/');
  }

  loadPosts() {
    // In TS ul tau initial asta trebuia pus aici in OnInit, dar era sus. L-am mutat corect.
    this.apiService.getPosts().subscribe({
      next: (data: any) => {
        this.allPosts = data;
        this.filterPosts();
      },
      error: (err: any) => console.error('Eroare incarcare postari:', err)
    });
  }

  filterPosts() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.visiblePosts = [...this.allPosts];
    } else {
      const term = this.searchText.toLowerCase();
      this.visiblePosts = this.allPosts.filter(post =>
        post.title?.toLowerCase().includes(term) ||
        (post.appUser?.userName || '').toLowerCase().includes(term)
      );
    }
  }

  showAddDialog() {
    this.isEditMode = false;
    this.postData = { title: '', content: '' };
    this.selectedFile = null;
    this.previewUrl = null;
    this.isPdfSelected = false;
    this.visible = true;
  }

  showEditDialog(post: any) {
    this.isEditMode = true;
    this.currentPostId = post.id;
    this.postData = { title: post.title, content: post.content };
    this.selectedFile = null;
    this.previewUrl = null;
    this.isPdfSelected = false;
    this.visible = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Verificam daca e PDF
      this.isPdfSelected = file.type === 'application/pdf';

      // Daca NU e PDF, afisam imaginea. Daca E pdf, nu incercam sa afisam un render de imagine.
      if (!this.isPdfSelected) {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrl = reader.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null; // Stergem preview-ul de imagine
      }
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
      formData.append('file', this.selectedFile); // Asta ramane la fel si pt PDF si pt Poza
    }

    if (this.isEditMode) {
      this.apiService.updatePost(this.currentPostId!, formData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts(); // Reincarcam direct din backend
        },
        error: (err: any) => alert("Eroare la editare!")
      });
    } else {
      this.apiService.createPost(formData).subscribe({
        next: () => {
          this.visible = false;
          this.loadPosts(); // Reincarcam sa vedem PDF-ul nou
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
    if (confirm("Sigur ștergi? (Adminul șterge orice!)")) {
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
        if (!post.comments) post.comments = [];
        post.comments.push(newComment);
        post.newCommentText = '';
      },
      error: () => alert("Eroare la adăugare comentariu")
    });
  }

  // Verifica daca userul curent e Student, Profesor sau Admin (Are voie sa interactioneze)
  canInteract(): boolean {
    if (!this.currentUser) return false;
    // Daca are unul din aceste roluri, ii afisam butoanele de Like, Comment si Profil
    return this.userRoles.includes('Student') ||
      this.userRoles.includes('Professor') ||
      this.userRoles.includes('Admin');
  }

  // Verifica daca autorul postarii este Profesor
  isProfessor(post: any): boolean {
    if (!post.appUser || !post.appUser.userRoles) return false;
    // Cautam in lista de roluri a celui care a creat postarea
    return post.appUser.userRoles.some((ur: any) => ur.role?.name === 'Professor');
  }

  showRequestDialog() {
    this.requestData = { requestedRole: 'Student', message: '' };
    this.requestDialogVisible = true;
  }

  submitRoleRequest() {
    if (!this.requestData.message || this.requestData.message.trim() === '') {
      alert("Te rog să adaugi un scurt mesaj justificativ (ex: grupa ta)!");
      return;
    }

    this.apiService.requestRole(this.requestData).subscribe({
      next: (res: any) => {
        alert(res.message || "Cererea a fost trimisă cu succes!");
        this.requestDialogVisible = false;
      },
      error: (err: any) => {
        // Afisam eroarea din backend (ex: "Ai deja o cerere in asteptare")
        alert(err.error || "Eroare la trimiterea cererii.");
      }
    });
  }
  isNormalUser(): boolean {
    if (!this.currentUser) return false;
    return this.userRoles.includes('Normal');
  }
}
