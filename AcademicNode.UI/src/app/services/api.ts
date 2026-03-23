import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Member } from '../models/member';
import { map } from 'rxjs/operators'; // Avem nevoie de asta pentru login

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  public baseUrl = 'http://localhost:5160/api';

  getHeaders() {
    const userString = localStorage.getItem('user');
    if (!userString) return {};
    const user = JSON.parse(userString);
    return new HttpHeaders({
      Authorization: 'Bearer ' + user.token
    });
  }

  // =========================================================
  // --- AUTHENTICATION (Login / Register / Logout) ---
  // =========================================================

  login(model: any) {
    return this.http.post(this.baseUrl + '/account/login', model).pipe(
      map((response: any) => {
        const user = response;
        if (user) {
          // 1. Salvam userul (token-ul) in memorie
          localStorage.setItem('user', JSON.stringify(user));
        }
        // 2. CRITIC: Trebuie sa returnam userul inapoi componenta!
        // Daca lipseste linia asta, componenta primeste "undefined"
        return user;
      })
    );
  }

  register(model: any) {
    return this.http.post(this.baseUrl + '/account/register', model).pipe(
      map((user: any) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return user;
      })
    );
  }

  logout() {
    localStorage.removeItem('user');
  }

  // =========================================================
  // --- MEMBERS & PHOTOS ---
  // =========================================================

  getMembers() {
    return this.http.get<Member[]>(this.baseUrl + '/users', { headers: this.getHeaders() });
  }

  getMember(username: string) {
    return this.http.get<Member>(this.baseUrl + '/users/' + username, { headers: this.getHeaders() });
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + '/users', member, { headers: this.getHeaders() });
  }

  uploadProfilePhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(this.baseUrl + '/users/add-photo', formData, { headers: this.getHeaders() });
  }

  // =========================================================
  // --- POSTARI (FEED) ---
  // =========================================================
  getPosts() {
    return this.http.get(this.baseUrl + '/posts', { headers: this.getHeaders() });
  }

  createPost(postData: FormData) {
    return this.http.post(this.baseUrl + '/posts', postData, { headers: this.getHeaders() });
  }

  updatePost(id: number, postData: FormData) {
    return this.http.put(this.baseUrl + '/posts/' + id, postData, { headers: this.getHeaders() });
  }

  deletePost(id: number) {
    return this.http.delete(this.baseUrl + '/posts/' + id, { headers: this.getHeaders() });
  }

  likePost(postId: number) {
    return this.http.post(this.baseUrl + '/posts/' + postId + '/like', {}, { headers: this.getHeaders() });
  }

  addComment(postId: number, content: string) {
    return this.http.post(this.baseUrl + '/posts/' + postId + '/comment', { content }, { headers: this.getHeaders() });
  }

  // =========================================================
  // --- METODE PENTRU PROFIL EXTINS ---
  // =========================================================

  // 1. EXPERIENTA
  addExperience(exp: any) {
    return this.http.post(this.baseUrl + '/users/add-experience', exp, { headers: this.getHeaders() });
  }
  deleteExperience(id: number) {
    return this.http.delete(this.baseUrl + '/users/delete-experience/' + id, { headers: this.getHeaders() });
  }

  // 2. STUDII
  addEducation(edu: any) {
    return this.http.post(this.baseUrl + '/users/add-education', edu, { headers: this.getHeaders() });
  }
  deleteEducation(id: number) {
    return this.http.delete(this.baseUrl + '/users/delete-education/' + id, { headers: this.getHeaders() });
  }

  // 3. PROIECTE
  addProject(proj: any) {
    return this.http.post(this.baseUrl + '/users/add-project', proj, { headers: this.getHeaders() });
  }
  deleteProject(id: number) {
    return this.http.delete(this.baseUrl + '/users/delete-project/' + id, { headers: this.getHeaders() });
  }

  // 4. CERTIFICARI
  addCertification(cert: any) {
    return this.http.post(this.baseUrl + '/users/add-certification', cert, { headers: this.getHeaders() });
  }
  deleteCertification(id: number) {
    return this.http.delete(this.baseUrl + '/users/delete-certification/' + id, { headers: this.getHeaders() });
  }
  updateExperience(exp: any) {
  
    return this.http.put(this.baseUrl + '/users/experience', exp, { headers: this.getHeaders() });
  }

  updateEducation(edu: any) {
    return this.http.put(this.baseUrl + '/users/education', edu, { headers: this.getHeaders() });
  }

  updateProject(proj: any) {
    return this.http.put(this.baseUrl + '/users/project', proj, { headers: this.getHeaders() });
  }

  updateCertification(cert: any) {
    return this.http.put(this.baseUrl + '/users/certification', cert, { headers: this.getHeaders() });
  }

  sendMessageToAI(message: string) {
    return this.http.post<any>(this.baseUrl + '/chat/ask', { message: message });
  }

  requestRole(data: any) {
    // 1. Luam userul din memorie
    const userString = localStorage.getItem('user');
    let headers = new HttpHeaders();

    // 2. Daca exista, ii atasam Token-ul in header
    if (userString) {
      const user = JSON.parse(userString);
      headers = headers.set('Authorization', 'Bearer ' + user.token);
    }

    // 3. Trimitem cererea + token-ul
    return this.http.post(this.baseUrl + '/rolerequests', data, { headers: headers });
  }

  // Helper mic pentru a lua token-ul mereu (ca sa nu scriem de 3 ori acelasi cod)
  private getAuthHeaders() {
    const userString = localStorage.getItem('user');
    let headers = new HttpHeaders();
    if (userString) {
      const user = JSON.parse(userString);
      headers = headers.set('Authorization', 'Bearer ' + user.token);
    }
    return { headers: headers };
  }

  getPendingRequests() {
    return this.http.get(this.baseUrl + '/rolerequests/pending', this.getAuthHeaders());
  }

  approveRoleRequest(id: number) {
    return this.http.post(this.baseUrl + `/rolerequests/${id}/approve`, {}, this.getAuthHeaders());
  }

  rejectRoleRequest(id: number) {
    return this.http.post(this.baseUrl + `/rolerequests/${id}/reject`, {}, this.getAuthHeaders());
  }

  forgotPassword(email: string) {
   
    return this.http.post(this.baseUrl + '/account/forgot-password', { email: email });
  }

  resetPassword(data: any) {
    
    return this.http.post(this.baseUrl + '/account/reset-password', data);
  }

  getUserPosts(username: string) {
    // 1. Cautam legitimația in buzunar
    const userString = localStorage.getItem('user');
    let headers = {};

    // 2. Daca o gasim, o pregatim de trimis
    if (userString) {
      const user = JSON.parse(userString);
      headers = { Authorization: 'Bearer ' + user.token };
    }

    // 3. Batem la usa serverului si ii aratam legitimația
    return this.http.get<any[]>(this.baseUrl + '/posts/user/' + username, { headers });
  }
}
