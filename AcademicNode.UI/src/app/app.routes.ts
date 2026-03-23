import { Routes } from '@angular/router';
import { FeedComponent } from './components/feed/feed';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { MemberDetailComponent } from './components/member-detail/member-detail';
import { roleGuard } from './role.guard';

// 1. IMPORTĂ COMPONENTA DE ADMIN (Verifică să fie calea corectă către fișierul tău)
import { AdminPanelComponent } from './components/admin-panel/admin-panel';
import { ResetPasswordComponent } from './components/reset-password/reset-password';

export const routes: Routes = [
  { path: '', component: FeedComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'members/:username', component: MemberDetailComponent },

  // 2. ADAUGĂ RUTA PENTRU ADMIN AICI:
  { path: 'admin', component: AdminPanelComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'members/:username', component: MemberDetailComponent, canActivate: [roleGuard] },
  { path: 'members', component: MemberDetailComponent, canActivate: [roleGuard] },
  // Ruta wildcard '**' RĂMÂNE OBLIGATORIU ULTIMA!
  { path: '**', redirectTo: '' }
];
