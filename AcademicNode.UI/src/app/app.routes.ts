import { Routes } from '@angular/router';
import { FeedComponent } from './components/feed/feed';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { MemberDetailComponent } from './components/member-detail/member-detail';

export const routes: Routes = [
 
  { path: '', component: FeedComponent },
  
  { path: 'login', component: LoginComponent },
  
  { path: 'register', component: RegisterComponent },
  
  { path: 'members/:username', component: MemberDetailComponent },

  { path: '**', redirectTo: '' }
];
