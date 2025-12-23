import { Routes } from '@angular/router';
// Importam componentele tale (poate la tine e fara /feed/feed daca ai nume scurte)
import { FeedComponent } from './components/feed/feed';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';

export const routes: Routes = [
  // Cand calea e goala (''), mergem la Feed
  { path: '', component: FeedComponent },
  // Cand calea e 'login', mergem la Login
  { path: 'login', component: LoginComponent },
  // Cand calea e 'register', mergem la Register
  { path: 'register', component: RegisterComponent },
  // Orice alta cale gresita ne duce inapoi la Feed
  { path: '**', redirectTo: '' }
];
