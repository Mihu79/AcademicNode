import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api';
import { Member } from '../../models/member';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { PostCardComponent } from '../post-card/post-card';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule,
    DialogModule, InputTextModule, DatePickerModule,
    TextareaModule, TabsModule, PostCardComponent, RouterModule,
  ],
  templateUrl: './member-detail.html',
  styleUrl: './member-detail.css'
})
export class MemberDetailComponent implements OnInit {
  private apiService = inject(ApiService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  editVisible: boolean = false;
  member: Member | undefined;
  currentUser: any = null;

  // NOU: Lista pentru postarile utilizatorului
  userPosts: any[] = [];
  isFollowing: boolean = false;
  followersList: any[] = [];
  followingList: any[] = [];
  showFollowersDialog: boolean = false;
  showFollowingDialog: boolean = false;
  searchPostTitle: string = '';
  userRoles: string[] = []; // Trebuie sa le extragem din currentUser la fel ca in feed, in ngOnInit

  editPostVisible: boolean = false;
  postData: any = { title: '', content: '' };
  currentPostId: number | null = null;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isPdfSelected: boolean = false;

  // Getter pentru filtrare in timp real pe profil
  get filteredUserPosts() {
    if (!this.searchPostTitle.trim()) return this.userPosts;
    const term = this.searchPostTitle.toLowerCase();
    return this.userPosts.filter(p => p.title?.toLowerCase().includes(term));
  }

  // Functii chemate de componenta post-card de pe profil
  startEditPost(post: any) {
    this.currentPostId = post.id;
    this.postData = { title: post.title, content: post.content };
    this.selectedFile = null;
    this.previewUrl = null;
    this.isPdfSelected = false;
    this.editPostVisible = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.isPdfSelected = file.type === 'application/pdf';

      if (!this.isPdfSelected) {
        const reader = new FileReader();
        reader.onload = () => this.previewUrl = reader.result;
        reader.readAsDataURL(file);
      } else {
        this.previewUrl = null;
      }
    }
  }

  submitPostUpdate() {
    const formData = new FormData();
    formData.append('title', this.postData.title);
    formData.append('content', this.postData.content);

    // Daca utilizatorul a incarcat o poza/pdf nou in dialog
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.apiService.updatePost(this.currentPostId!, formData).subscribe({
      next: () => {
        this.editPostVisible = false;
        this.loadUserPosts(this.member!.username); // Reincarcam lista cu poza noua
        alert("Postare actualizată cu succes!");
      },
      error: () => alert("Eroare la editare!")
    });
  }
  deletePost(postId: number) {
    if (confirm("Sigur ștergi această postare?")) {
      this.apiService.deletePost(postId).subscribe({
        next: () => {
          this.userPosts = this.userPosts.filter(p => p.id !== postId);
          this.cdr.detectChanges();
        }
      });
    }
  }

  newExperience: any = {};
  newEducation: any = {};
  newProject: any = {};
  newCertification: any = {};

  editingExpId: number | null = null;
  editingEduId: number | null = null;
  editingProjId: number | null = null;
  editingCertId: number | null = null;

 

  ngOnInit(): void {
    // 1. Păstrăm logica ta pentru utilizatorul curent și extragerea rolurilor
    const userString = localStorage.getItem('user');
    if (userString && userString !== 'undefined' && userString !== 'null') {
      this.currentUser = JSON.parse(userString);

      // MAGIA CARE LIPSEA: Extragem rolurile din Token și pe pagina de profil!
      if (this.currentUser.token) {
        const payload = JSON.parse(atob(this.currentUser.token.split('.')[1]));
        const roles = payload.role;
        this.userRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);
      }
    }

    // 2. RADARUL PENTRU LINK: Ascultăm orice schimbare a adresei web
    this.route.paramMap.subscribe(params => {
      // Extragem numele din noul link pe care tocmai ai dat click
      const currentUsername = params.get('username');

      if (currentUsername) {
        // Închidem ferestrele mici (dacă erau deschise din profilul anterior)
        this.showFollowersDialog = false;
        this.showFollowingDialog = false;

        // Dacă funcția ta loadMember folosește o variabilă globală (ex: this.username), actualizeaz-o aici:
        // this.username = currentUsername; 

        // Acum că linkul s-a schimbat, forțăm aducerea datelor noi de la server!
        this.loadMember();
      }
    });
  }

  loadMember() {
    const username = this.route.snapshot.paramMap.get('username');
    if (!username) return;

    this.apiService.getMember(username).subscribe({
      next: (member) => {
        this.member = member;
        if (this.member.photoUrl && !this.member.photoUrl.startsWith('http')) {
          const serverUrl = this.apiService.baseUrl.replace('/api', '');
          this.member.photoUrl = serverUrl + '/' + this.member.photoUrl;
        }

        // NOU: Dupa ce am adus profilul, aducem si postarile lui!
        this.loadUserPosts(username);
        this.loadFollowStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 403) {
          alert("🛡️ Acces Interzis! Conturile cu rolul 'Normal' nu au acces la profiluri.");
          this.router.navigate(['/']);
        } else {
          console.error("Eroare la incarcarea membrului:", err);
        }
      }
    })
  }

  toggleFollow() {
    if (!this.member || !this.currentUser) return;

    this.apiService.toggleFollow(this.member.username).subscribe({
      next: () => {
        // Inversăm starea butonului
        this.isFollowing = !this.isFollowing;

        // Actualizăm numărul live pe ecran
        if (this.isFollowing) {
          // Dacă i-am dat follow, mă adaug pe mine în listă (crește numărul)
          this.followersList.push({ username: this.currentUser.username });
        } else {
          // Dacă i-am dat unfollow, mă scot din listă (scade numărul)
          this.followersList = this.followersList.filter(user => user.username !== this.currentUser.username);
        }
      },
      error: (err) => console.error("Eroare la follow/unfollow", err)
    });
  }

  loadFollowStats() {
    if (!this.member) return;

    // 1. Aducem lista cu cine îl urmărește pe acest utilizator
    this.apiService.getFollowers(this.member.username).subscribe(data => {
      this.followersList = data;

      // VERIFICAREA ANTIGLONȚ: Citim buletinul tău direct din seiful browserului
      const userString = localStorage.getItem('user');

      if (userString && userString !== 'undefined') {
        const loggedInUser = JSON.parse(userString);

        // Preluăm numele tău indiferent cum ni-l dă C#-ul (cu litere mari sau mici)
        const myName = loggedInUser.username || loggedInUser.userName;

        // Căutăm exact numele ăsta în lista primită de la server
        this.isFollowing = this.followersList.some(user => user.username === myName);
      }
    });

    // 2. Aducem lista cu pe cine urmărește el
    this.apiService.getFollowing(this.member.username).subscribe(data => {
      this.followingList = data;
    });
  }

  openFollowers() {
    if (!this.member) return;
    this.apiService.getFollowers(this.member.username).subscribe({
      next: (data) => {
        this.followersList = data;
        this.showFollowersDialog = true; // Deschidem fereastra
      }
    });
  }

  openFollowing() {
    if (!this.member) return;
    this.apiService.getFollowing(this.member.username).subscribe({
      next: (data) => {
        this.followingList = data;
        this.showFollowingDialog = true; // Deschidem fereastra
      }
    });
  }

  // NOU: Functia care cheama API-ul de postari
  loadUserPosts(username: string) {
    this.apiService.getUserPosts(username).subscribe({
      next: (posts: any[]) => {
        // Mapam fiecare postare si ii atasam fortat rolul, ca PostCardComponent sa il vada
        this.userPosts = posts.map(p => {
          if (this.member) {
            p.appUser = p.appUser || {};
            p.appUser.userName = this.member.username;
            // Daca profilul pe care ne uitam e de profesor, punem stampila pe postare
            if (this.member.role === 'Professor') {
              p.appUser.userRoles = [{ role: { name: 'Professor' } }];
            }
          }
          return p;
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Eroare la aducerea postarilor", err)
    });
  }

  showEditDialog() {
    this.resetForms();
    this.editVisible = true;
  }

  resetForms() {
    this.newExperience = {}; this.editingExpId = null;
    this.newEducation = {}; this.editingEduId = null;
    this.newProject = {}; this.editingProjId = null;
    this.newCertification = {}; this.editingCertId = null;
  }

  updateProfile() {
    if (!this.member) return;
    this.apiService.updateMember(this.member).subscribe({
      next: () => alert("Datele generale actualizate!"),
      error: (err) => alert("Eroare la actualizare")
    });
  }

  onPhotoSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.apiService.uploadProfilePhoto(file).subscribe({
        next: (response: any) => {
          const serverUrl = this.apiService.baseUrl.replace('/api', '');
          const fullUrl = serverUrl + '/' + response.url;
          if (this.member) this.member.photoUrl = fullUrl;
          if (this.currentUser) {
            this.currentUser.photoUrl = fullUrl;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
          }
          this.cdr.detectChanges();
          alert("Poza actualizată!");
        }
      });
    }
  }

  // --- RESTUL FUNCTIILOR TALE PENTRU EXPERIENTA, STUDII ETC. RAMAN EXACT LA FEL ---
  startEditExperience(exp: any) { this.newExperience = { ...exp }; if (exp.startDate) this.newExperience.startDate = new Date(exp.startDate); if (exp.endDate) this.newExperience.endDate = new Date(exp.endDate); this.editingExpId = exp.id; }
  cancelEditExperience() { this.newExperience = {}; this.editingExpId = null; }
  saveExperience() { if (!this.newExperience.company || !this.newExperience.position) return; if (this.editingExpId) { this.apiService.updateExperience(this.newExperience).subscribe({ next: () => { const index = this.member!.experiences.findIndex(x => x.id === this.editingExpId); if (index !== -1) this.member!.experiences[index] = { ...this.newExperience }; alert("Experiență actualizată!"); this.cancelEditExperience(); this.cdr.detectChanges(); } }); } else { this.apiService.addExperience(this.newExperience).subscribe({ next: (addedExp: any) => { if (!this.member!.experiences) this.member!.experiences = []; this.member!.experiences.push(addedExp); alert("Experiență adăugată!"); this.cancelEditExperience(); this.cdr.detectChanges(); } }); } }
  deleteExperience(id: number) { if (!confirm('Stergi?')) return; this.apiService.deleteExperience(id).subscribe({ next: () => { this.member!.experiences = this.member!.experiences.filter(x => x.id !== id); this.cdr.detectChanges(); } }); }

  startEditEducation(edu: any) { this.newEducation = { ...edu }; if (edu.startDate) this.newEducation.startDate = new Date(edu.startDate); if (edu.endDate) this.newEducation.endDate = new Date(edu.endDate); this.editingEduId = edu.id; }
  cancelEditEducation() { this.newEducation = {}; this.editingEduId = null; }
  saveEducation() { if (!this.newEducation.school) return; if (this.editingEduId) { this.apiService.updateEducation(this.newEducation).subscribe({ next: () => { const index = this.member!.educations.findIndex(x => x.id === this.editingEduId); if (index !== -1) this.member!.educations[index] = { ...this.newEducation }; alert("Studii actualizate!"); this.cancelEditEducation(); this.cdr.detectChanges(); } }); } else { this.apiService.addEducation(this.newEducation).subscribe({ next: (addedEdu: any) => { if (!this.member!.educations) this.member!.educations = []; this.member!.educations.push(addedEdu); alert("Studii adăugate!"); this.cancelEditEducation(); this.cdr.detectChanges(); } }); } }
  deleteEducation(id: number) { if (!confirm('Stergi?')) return; this.apiService.deleteEducation(id).subscribe({ next: () => { this.member!.educations = this.member!.educations.filter(x => x.id !== id); this.cdr.detectChanges(); } }); }

  startEditProject(proj: any) { this.newProject = { ...proj }; if (proj.startDate) this.newProject.startDate = new Date(proj.startDate); if (proj.endDate) this.newProject.endDate = new Date(proj.endDate); this.editingProjId = proj.id; }
  cancelEditProject() { this.newProject = {}; this.editingProjId = null; }
  saveProject() { if (!this.newProject.name) return; if (this.editingProjId) { this.apiService.updateProject(this.newProject).subscribe({ next: () => { const index = this.member!.projects.findIndex(x => x.id === this.editingProjId); if (index !== -1) this.member!.projects[index] = { ...this.newProject }; alert("Proiect actualizat!"); this.cancelEditProject(); this.cdr.detectChanges(); } }); } else { this.apiService.addProject(this.newProject).subscribe({ next: (addedProj: any) => { if (!this.member!.projects) this.member!.projects = []; this.member!.projects.push(addedProj); alert("Proiect adăugat!"); this.cancelEditProject(); this.cdr.detectChanges(); } }); } }
  deleteProject(id: number) { if (!confirm('Stergi?')) return; this.apiService.deleteProject(id).subscribe({ next: () => { this.member!.projects = this.member!.projects.filter(x => x.id !== id); this.cdr.detectChanges(); } }); }

  startEditCertification(cert: any) { this.newCertification = { ...cert }; if (cert.dateIssued) this.newCertification.dateIssued = new Date(cert.dateIssued); this.editingCertId = cert.id; }
  cancelEditCertification() { this.newCertification = {}; this.editingCertId = null; }
  saveCertification() { if (!this.newCertification.name) return; if (this.editingCertId) { this.apiService.updateCertification(this.newCertification).subscribe({ next: () => { const index = this.member!.certifications.findIndex(x => x.id === this.editingCertId); if (index !== -1) this.member!.certifications[index] = { ...this.newCertification }; alert("Certificare actualizată!"); this.cancelEditCertification(); this.cdr.detectChanges(); } }); } else { this.apiService.addCertification(this.newCertification).subscribe({ next: (addedCert: any) => { if (!this.member!.certifications) this.member!.certifications = []; this.member!.certifications.push(addedCert); alert("Certificare adăugată!"); this.cancelEditCertification(); this.cdr.detectChanges(); } }); } }
  deleteCertification(id: number) { if (!confirm('Stergi?')) return; this.apiService.deleteCertification(id).subscribe({ next: () => { this.member!.certifications = this.member!.certifications.filter(x => x.id !== id); this.cdr.detectChanges(); } }); }
}
