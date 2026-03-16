import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user'; // Asigura-te ca ai creat fisierul user.ts aici


@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Folosim adresa ta exacta
  baseUrl = 'http://localhost:5160/api/';

  constructor(private http: HttpClient) { }

  getUsersWithRoles() {
    // 1. Luam userul logat din memoria browserului (localStorage)
    const userString = localStorage.getItem('user');
    let token = '';

    if (userString) {
      const user = JSON.parse(userString);
      token = user.token; // Extragem token-ul
    }

    // 2. Il punem in "plic" (in Header-ul cererii)
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token
      })
    };

    // 3. Trimitem cererea impreuna cu plicul (httpOptions)
    return this.http.get<Partial<User>[]>(this.baseUrl + 'admin/users-with-roles', httpOptions);
  }

  updateUserRoles(username: string, roles: string) {
    // 1. Luam token-ul
    const userString = localStorage.getItem('user');
    let token = '';
    if (userString) {
      token = JSON.parse(userString).token;
    }

    // 2. Punem token-ul in header
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + token
      })
    };

    // 3. Trimitem la Backend
    return this.http.post<string[]>(this.baseUrl + 'admin/edit-roles/' + username + '?roles=' + roles, {}, httpOptions);
  }
}
