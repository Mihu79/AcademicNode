import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

// Acest gardian sta la usa fiecarei pagini pe care o protejam
export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userString = localStorage.getItem('user');
  console.log("🚨 GARDIANUL A FOST TREZIT PENTRU RUTA: ", state.url);

  if (userString) {
    const user = JSON.parse(userString);
    if (user.token) {
      // Extragem rolul din Token
      const payload = JSON.parse(atob(user.token.split('.')[1]));
      const roles = payload.role;
      const userRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

      // DACA ESTE ROLUL NORMAL -> IL BLOCAM SI IL TRIMITEM INAPOI
      if (userRoles.includes('Normal')) {
        alert('Nu ai permisiunea de a vizita profilurile utilizatorilor! Așteaptă aprobarea administratorului.');
        router.navigate(['/']); // Il trimitem pe pagina principala
        return false; // NU ii dam voie sa intre
      }

      return true; // Daca e Student/Profesor/Admin are voie
    }
  }

  // Daca nu e logat deloc, merge la login
  router.navigate(['/login']);
  return false;
};
