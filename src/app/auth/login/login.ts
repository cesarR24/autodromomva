import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  isRegisterMode = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.isRegisterMode) {
      await this.onRegister();
      return;
    }
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = error.message || 'Error al iniciar sesión';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const { name, email, password } = this.registerForm.value;
        const cred = await this.authService.register(email, password);
        // Actualizar el nombre en el perfil
        if (cred.user) {
          await this.authService.updateProfileName(cred.user.uid, name /*, team opcional en el futuro */);
        }
        this.isRegisterMode = false;
        this.loginForm.patchValue({ email, password: '' });
        this.errorMessage = 'Registro exitoso. Ahora puedes iniciar sesión.';
      } catch (error: any) {
        this.errorMessage = error.message || 'Error al registrar usuario';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async loginWithCustomToken() {
    const token = prompt('Introduce el custom token:');
    if (token) {
      try {
        await this.authService.signInWithCustomToken(token);
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        this.errorMessage = error.message || 'Error con el token';
      }
    }
  }

  switchMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
    this.isLoading = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }
}
