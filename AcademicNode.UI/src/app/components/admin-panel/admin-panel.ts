import { Component, OnInit } from '@angular/core';
import { User } from '../../models/user';
import { AdminService } from '../../services/admin'

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  users: Partial<User>[] = [];

  // Variabile noi pentru editare
  availableRoles = ['Admin', 'Professor', 'Student', 'Normal'];
  editingUser: Partial<User> | null = null;
  selectedRoles: string[] = [];

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.getUsersWithRoles();
  }

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
