import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  // Asigura-te ca portul este cel corect (5160 sau 5001, verifica in terminalul Backend)
  private baseUrl = 'http://localhost:5160/api';

  constructor() { }

  // --- FUNCTIA CHEIE: Creeaza header-ul cu Token ---
  private getHeaders() {
    const userString = localStorage.getItem('user');
    if (!userString) return new HttpHeaders();

    const user = JSON.parse(userString);
    return new HttpHeaders().set('Authorization', `Bearer ${user.token}`);
  }

  // --- METODE PUBLICE ---
  login(model: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/account/login`, model);
  }

  register(model: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/account/register`, model);
  }

  // --- METODE CARE AU NEVOIE DE TOKEN (HEADERS) ---

  // 1. GET POSTS
  getPosts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts`, { headers: this.getHeaders() });
  }

  // 2. CREATE POST (Asta iti mergea deja)
  createPost(model: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/posts`, model, { headers: this.getHeaders() });
  }

  // 3. EDIT POST (Asta nu mergea)
  updatePost(id: number, data: any): Observable<any> {
    // Am adaugat headers aici
    return this.http.put(`${this.baseUrl}/posts/${id}`, data, { headers: this.getHeaders() });
  }

  // 4. DELETE POST (Asta nu mergea)
  deletePost(id: number): Observable<any> {
    // Am adaugat headers aici
    return this.http.delete(`${this.baseUrl}/posts/${id}`, { headers: this.getHeaders() });
  }

  // 5. LIKE POST (Asta nu mergea)
  likePost(id: number): Observable<any> {
    // Am adaugat headers aici
    return this.http.post(`${this.baseUrl}/posts/${id}/like`, {}, { headers: this.getHeaders() });
  }

  addComment(postId: number, content: string): Observable<any> {
    // Schimbam cheia sa fie cu litera mare, exact ca in C#
    return this.http.post(`${this.baseUrl}/comments/${postId}`, { Content: content }, { headers: this.getHeaders() });
  }
}
