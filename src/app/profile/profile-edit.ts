import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';
import { DataService } from '../data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="max-w-lg mx-auto mt-10 bg-white rounded-lg shadow p-8">
    <h2 class="text-2xl font-bold mb-6 text-center">Editar Perfil</h2>
    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input formControlName="name" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del equipo</label>
        <input formControlName="team" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div class="flex justify-between items-center mt-6">
        <button type="submit" [disabled]="profileForm.invalid || isLoading" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">
          {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
        <button type="button" (click)="goBack()" class="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium">Volver al Dashboard</button>
      </div>
      <div *ngIf="successMessage" class="text-green-600 text-center mt-2">{{ successMessage }}</div>
      <div *ngIf="errorMessage" class="text-red-600 text-center mt-2">{{ errorMessage }}</div>
    </form>
  </div>
  `
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      team: ['']
    });
  }

  async ngOnInit() {
    const user = this.authService.getUserId ? this.authService.getUserId() : null;
    if (user) {
      const profile = await this.dataService.getCurrentUserProfile(user);
      if (profile) {
        this.profileForm.patchValue({
          name: profile.name || '',
          team: profile.team || ''
        });
      }
    }
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';
      try {
        const userId = this.authService.getUserId();
        if (!userId) throw new Error('Usuario no autenticado');
        const { name, team } = this.profileForm.value;
        await this.dataService.updateDriverProfile(userId, { name, team });
        await this.authService.updateProfileName(userId, name, team);
        this.successMessage = 'Perfil actualizado correctamente';
      } catch (err: any) {
        this.errorMessage = err.message || 'Error al actualizar el perfil';
      } finally {
        this.isLoading = false;
      }
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
} 