import { Component, OnInit } from '@angular/core';
import { User } from '../../models/user';
import { AdminService } from '../../services/admin';
import { ApiService } from '../../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  users: Partial<User>[] = [];

  // Variabile pentru editare manuala
  availableRoles = ['Admin', 'Professor', 'Student', 'Normal'];
  editingUser: Partial<User> | null = null;
  selectedRole: string = ''; // Acum e un singur cuvant

  // Variabila pentru cererile noi
  pendingRequests: any[] = [];

  constructor(private adminService: AdminService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.getUsersWithRoles();
    this.loadPendingRequests();
  }

  // ==========================================
  // 1. LOGICA PENTRU CERERI DE ROL (Tabelul de Sus)
  // ==========================================

  loadPendingRequests() {
    this.apiService.getPendingRequests().subscribe({
      next: (requests: any) => this.pendingRequests = requests,
      error: (err: any) => console.log("Eroare incarcare cereri:", err)
    });
  }

  approveRequest(id: number) {
    if (confirm("Sigur aprobi această cerere? Utilizatorul va primi rolul imediat.")) {
      this.apiService.approveRoleRequest(id).subscribe({
        next: (res: any) => {
          alert(res.message);
          this.loadPendingRequests(); // Scoatem cererea din tabelul de sus
          this.getUsersWithRoles();   // Actualizam tabelul de jos ca sa vedem noul rol!
        },
        error: (err: any) => alert(err.error || "Eroare la aprobare")
      });
    }
  }

  rejectRequest(id: number) {
    if (confirm("Sigur respingi această cerere?")) {
      this.apiService.rejectRoleRequest(id).subscribe({
        next: (res: any) => {
          alert(res.message);
          this.loadPendingRequests(); // Scoatem cererea din tabel
        },
        error: (err: any) => alert(err.error || "Eroare la respingere")
      });
    }
  }

  // ==========================================
  // 2. LOGICA PENTRU EDITARE MANUALA (Tabelul de Jos)
  // ==========================================

  getUsersWithRoles() {
    this.adminService.getUsersWithRoles().subscribe({
      next: (users: Partial<User>[]) => this.users = users,
      error: (err: any) => console.log(err)
    });
  }

  // Cand apasam pe butonul albastru "Editeaza"
  openEditPanel(user: any) {
    this.editingUser = user;
    // Luam primul rol pe care il are (sau il lasam gol daca nu are)
    this.selectedRole = user.roles && user.roles.length > 0 ? user.roles[0] : '';
  }

  // Cand apasam "Salveaza"
  saveRoles() {
    if (!this.editingUser?.username) return;

    if (!this.selectedRole) {
      alert("Te rog să selectezi un rol din listă!");
      return;
    }

    // Acum trimitem fix cuvantul selectat (ex: "Professor") catre backend
    this.adminService.updateUserRoles(this.editingUser.username, this.selectedRole).subscribe({
      next: (roles: string[]) => {
        if (this.editingUser) {
          this.editingUser.roles = roles; // Actualizam tabelul vizual cu noul rol venit de la server
        }
        
        this.editingUser = null; // Inchidem panoul de editare
      },
      error: (err: any) => alert("A apărut o eroare la salvare!")
    });
  }

  // Cand apasam "Anuleaza"
  cancelEdit() {
    this.editingUser = null;
  }
}
