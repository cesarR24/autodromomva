import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  userId: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userId = user ? user.uid : null;
    });
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  async login() {
    // Lógica de login normal (redirigir a /login)
    this.router.navigate(['/login']);
  }

  async loginWithCustomToken() {
    // Lógica para Canvas: obtener el token de alguna fuente y autenticar
    const token = prompt('Introduce el custom token:');
    if (token) {
      await this.authService.signInWithCustomToken(token);
    }
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
