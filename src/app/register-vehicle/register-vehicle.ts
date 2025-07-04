import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/auth';
import { DataService } from '../data.service';

@Component({
  selector: 'app-register-vehicle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden">
      <!-- Fondo de imagen registro -->
      <img src="/backgroundregistry.jpg" alt="Fondo Registro" class="fixed inset-0 w-full h-full object-cover z-0 opacity-80" />
      <!-- Overlay oscuro para contraste -->
      <div class="fixed inset-0 bg-black/80 z-10 backdrop-blur-md"></div>
      <div class="relative z-20 bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 shadow-lg w-full max-w-lg">
        <h1 class="text-2xl font-bold mb-6 text-cyan-300 text-center">Registro de Piloto y Vehículo</h1>
        <form [formGroup]="vehicleForm" (ngSubmit)="onSubmit()" autocomplete="off">
          <div class="mb-4">
            <label class="block mb-1 text-white">Nombre del Piloto</label>
            <input formControlName="driverName" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" readonly />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Email</label>
            <input formControlName="email" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" readonly />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Teléfono</label>
            <input formControlName="phone" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Marca del Vehículo</label>
            <input formControlName="brand" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Número del Vehículo</label>
            <input formControlName="number" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Categoría</label>
            <input formControlName="category" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-white">Equipo</label>
            <input formControlName="team" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" />
          </div>
          <div class="mb-6">
            <label class="block mb-1 text-white">Modelo/Año (opcional)</label>
            <input formControlName="model" class="w-full rounded p-2 bg-gray-800 text-white placeholder-gray-300" />
          </div>
          <button type="submit" [disabled]="vehicleForm.invalid" class="w-full bg-cyan-600 hover:bg-cyan-700 rounded p-3 font-bold text-white transition-all">Guardar y Continuar</button>
        </form>
      </div>
    </div>
  `
})
export class RegisterVehicleComponent implements OnInit {
  vehicleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private dataService: DataService
  ) {
    this.vehicleForm = this.fb.group({
      driverName: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      brand: ['', Validators.required],
      number: ['', Validators.required],
      category: ['', Validators.required],
      team: [''],
      model: ['']
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.vehicleForm.patchValue({
          driverName: user.displayName || '',
          email: user.email || ''
        });
      }
    });
  }

  async onSubmit() {
    if (this.vehicleForm.valid) {
      const uid = this.authService.getUserId();
      if (!uid) return;
      // Guardar en driverProfiles
      await this.dataService.setDriverProfile(uid, this.vehicleForm.value);
      this.router.navigate(['/dashboard']);
    }
  }
} 