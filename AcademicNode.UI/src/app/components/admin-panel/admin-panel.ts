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
  selectedRoles: string[] = [];

  // --- ADAUGAT: Variabila pentru cererile noi ---
  pendingRequests: any[] = [];

  // --- ADAUGAT: Injectam ApiService langa AdminService ---
  constructor(private adminService: AdminService, private apiService: ApiService) { }

  ngOnInit(): void {
    this.getUsersWithRoles();
    this.loadPendingRequests(); // Incarcam si cererile cand se deschide pagina
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
  openEditPanel(user: Partial<User>) {
    this.editingUser = user;
    // Copiem rolurile pe care le are deja, ca sa apara bifate
    this.selectedRoles = [...(user.roles || [])];
  }

  // Cand bifam sau debifam o casuta
  toggleRole(role: string) {
    const index = this.selectedRoles.indexOf(role);
    if (index !== -1) {
      this.selectedRoles.splice(index, 1); // Daca era bifat, il scoatem
    } else {
      this.selectedRoles.push(role); // Daca nu era, il adaugam
    }
  }

  // Cand apasam "Salveaza"
  saveRoles() {
    if (!this.editingUser?.username) return;

    // Transformam array-ul ['Professor', 'Student'] in string-ul "Professor,Student" pentru C#
    const rolesString = this.selectedRoles.join(',');

    this.adminService.updateUserRoles(this.editingUser.username, rolesString).subscribe({
      next: (roles: string[]) => {
        if (this.editingUser) {
          this.editingUser.roles = roles; // Actualizam tabelul vizual cu noile roluri
        }
        this.editingUser = null; // Inchidem panoul de editare
      },
      error: (err: any) => console.log(err)
    });
  }

  // Cand apasam "Anuleaza"
  cancelEdit() {
    this.editingUser = null;
  }
}
