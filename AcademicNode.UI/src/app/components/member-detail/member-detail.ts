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

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule,
    DialogModule, InputTextModule, DatePickerModule,
    TextareaModule, TabsModule
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

  // Obiectele pentru formulare
  newExperience: any = {};
  newEducation: any = {};
  newProject: any = {};
  newCertification: any = {};

  // ID-urile elementelor pe care le editam (null = mod adaugare)
  editingExpId: number | null = null;
  editingEduId: number | null = null;
  editingProjId: number | null = null;
  editingCertId: number | null = null;

  ngOnInit(): void {
    const userString = localStorage.getItem('user');
    if (userString && userString !== 'undefined') {
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
        if (this.member.photoUrl && !this.member.photoUrl.startsWith('http')) {
          const serverUrl = this.apiService.baseUrl.replace('/api', '');
          this.member.photoUrl = serverUrl + '/' + this.member.photoUrl;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        // --- MODIFICARE: Interceptam eroarea 403 Forbidden ---
        if (err.status === 403) {
          alert("🛡️ Acces Interzis! Conturile cu rolul 'Normal' nu au acces la profiluri.");
          this.router.navigate(['/']); // Il dam afara inapoi in pagina principala (feed)
        } else {
          console.error("Eroare la incarcarea membrului:", err);
        }
      }
    })
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

  // =========================================================
  // LOGICA EXPERIENTA (ADD + EDIT + DELETE)
  // =========================================================

  // 1. Cand apesi pe Creion
  startEditExperience(exp: any) {
    // Copiem datele in formular
    this.newExperience = { ...exp };
    // Convertim datele string in obiecte Date pentru DatePicker
    if (exp.startDate) this.newExperience.startDate = new Date(exp.startDate);
    if (exp.endDate) this.newExperience.endDate = new Date(exp.endDate);

    this.editingExpId = exp.id; // Activam modul editare
  }

  // 2. Cand apesi Cancel
  cancelEditExperience() {
    this.newExperience = {};
    this.editingExpId = null;
  }

  // 3. Cand apesi Salveaza/Adauga
  saveExperience() {
    if (!this.newExperience.company || !this.newExperience.position) return;

    if (this.editingExpId) {
      // MOD EDITARE
      this.apiService.updateExperience(this.newExperience).subscribe({
        next: () => {
          // Actualizam lista locala manual
          const index = this.member!.experiences.findIndex(x => x.id === this.editingExpId);
          if (index !== -1) this.member!.experiences[index] = { ...this.newExperience };

          alert("Experiență actualizată!");
          this.cancelEditExperience(); // Reset form
          this.cdr.detectChanges();
        }
      });
    } else {
      // MOD ADAUGARE
      this.apiService.addExperience(this.newExperience).subscribe({
        next: (addedExp: any) => {
          if (!this.member!.experiences) this.member!.experiences = [];
          this.member!.experiences.push(addedExp);
          alert("Experiență adăugată!");
          this.cancelEditExperience();
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteExperience(id: number) {
    if (!confirm('Stergi?')) return;
    this.apiService.deleteExperience(id).subscribe({
      next: () => {
        this.member!.experiences = this.member!.experiences.filter(x => x.id !== id);
        this.cdr.detectChanges();
      }
    });
  }


  // =========================================================
  // LOGICA STUDII (ADD + EDIT + DELETE)
  // =========================================================
  startEditEducation(edu: any) {
    this.newEducation = { ...edu };
    if (edu.startDate) this.newEducation.startDate = new Date(edu.startDate);
    if (edu.endDate) this.newEducation.endDate = new Date(edu.endDate);
    this.editingEduId = edu.id;
  }

  cancelEditEducation() {
    this.newEducation = {};
    this.editingEduId = null;
  }

  saveEducation() {
    if (!this.newEducation.school) return;

    if (this.editingEduId) {
      this.apiService.updateEducation(this.newEducation).subscribe({
        next: () => {
          const index = this.member!.educations.findIndex(x => x.id === this.editingEduId);
          if (index !== -1) this.member!.educations[index] = { ...this.newEducation };
          alert("Studii actualizate!");
          this.cancelEditEducation();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.addEducation(this.newEducation).subscribe({
        next: (addedEdu: any) => {
          if (!this.member!.educations) this.member!.educations = [];
          this.member!.educations.push(addedEdu);
          alert("Studii adăugate!");
          this.cancelEditEducation();
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteEducation(id: number) {
    if (!confirm('Stergi?')) return;
    this.apiService.deleteEducation(id).subscribe({
      next: () => {
        this.member!.educations = this.member!.educations.filter(x => x.id !== id);
        this.cdr.detectChanges();
      }
    });
  }


  // =========================================================
  // LOGICA PROIECTE (ADD + EDIT + DELETE)
  // =========================================================
  startEditProject(proj: any) {
    this.newProject = { ...proj };
    if (proj.startDate) this.newProject.startDate = new Date(proj.startDate);
    if (proj.endDate) this.newProject.endDate = new Date(proj.endDate);
    this.editingProjId = proj.id;
  }

  cancelEditProject() {
    this.newProject = {};
    this.editingProjId = null;
  }

  saveProject() {
    if (!this.newProject.name) return;

    if (this.editingProjId) {
      this.apiService.updateProject(this.newProject).subscribe({
        next: () => {
          const index = this.member!.projects.findIndex(x => x.id === this.editingProjId);
          if (index !== -1) this.member!.projects[index] = { ...this.newProject };
          alert("Proiect actualizat!");
          this.cancelEditProject();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.addProject(this.newProject).subscribe({
        next: (addedProj: any) => {
          if (!this.member!.projects) this.member!.projects = [];
          this.member!.projects.push(addedProj);
          alert("Proiect adăugat!");
          this.cancelEditProject();
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteProject(id: number) {
    if (!confirm('Stergi?')) return;
    this.apiService.deleteProject(id).subscribe({
      next: () => {
        this.member!.projects = this.member!.projects.filter(x => x.id !== id);
        this.cdr.detectChanges();
      }
    });
  }


  // =========================================================
  // LOGICA CERTIFICARI (ADD + EDIT + DELETE)
  // =========================================================
  startEditCertification(cert: any) {
    this.newCertification = { ...cert };
    if (cert.dateIssued) this.newCertification.dateIssued = new Date(cert.dateIssued);
    this.editingCertId = cert.id;
  }

  cancelEditCertification() {
    this.newCertification = {};
    this.editingCertId = null;
  }

  saveCertification() {
    if (!this.newCertification.name) return;

    if (this.editingCertId) {
      this.apiService.updateCertification(this.newCertification).subscribe({
        next: () => {
          const index = this.member!.certifications.findIndex(x => x.id === this.editingCertId);
          if (index !== -1) this.member!.certifications[index] = { ...this.newCertification };
          alert("Certificare actualizată!");
          this.cancelEditCertification();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.apiService.addCertification(this.newCertification).subscribe({
        next: (addedCert: any) => {
          if (!this.member!.certifications) this.member!.certifications = [];
          this.member!.certifications.push(addedCert);
          alert("Certificare adăugată!");
          this.cancelEditCertification();
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteCertification(id: number) {
    if (!confirm('Stergi?')) return;
    this.apiService.deleteCertification(id).subscribe({
      next: () => {
        this.member!.certifications = this.member!.certifications.filter(x => x.id !== id);
        this.cdr.detectChanges();
      }
    });
  }
}
