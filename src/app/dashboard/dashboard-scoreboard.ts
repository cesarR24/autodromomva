import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../data.service';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-dashboard-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-scoreboard.html',
  styleUrls: ['./dashboard-scoreboard.css']
})
export class DashboardScoreboardComponent implements OnInit {
  // Datos simulados para la demo visual
  userProfile = {
    name: 'Pablo',
    number: 7,
    team: 'Dragons',
    category: 'Pro',
    email: 'pablo@pablo.com',
    teamLogoUrl: '/logo-monclova.png'
  };
  miniStats = {
    avgRT: 0.523,
    avgET: 12.321,
    breakoutPct: 0.12
  };
  pilotosPorVictorias = [
    { name: 'Juan', victorias: 12 },
    { name: 'Pablo', victorias: 10 },
    { name: 'Ana', victorias: 8 },
    { name: 'Luis', victorias: 6 },
    { name: 'Carlos', victorias: 5 },
    { name: 'Sofía', victorias: 4 },
    { name: 'Miguel', victorias: 3 },
    { name: 'Valeria', victorias: 3 },
    { name: 'Andrés', victorias: 2 },
    { name: 'Lucía', victorias: 2 },
    { name: 'Diego', victorias: 1 },
    { name: 'Fernanda', victorias: 1 },
    { name: 'Roberto', victorias: 1 },
    { name: 'Elena', victorias: 1 },
    { name: 'Marcos', victorias: 1 },
    { name: 'Patricia', victorias: 1 },
    { name: 'Jorge', victorias: 1 },
    { name: 'Camila', victorias: 1 },
    { name: 'Emilio', victorias: 1 },
    { name: 'Paula', victorias: 1 },
    { name: 'Ricardo', victorias: 1 },
    { name: 'Natalia', victorias: 1 },
    { name: 'Héctor', victorias: 1 },
    { name: 'Gabriela', victorias: 1 },
  ];
  sponsors = [
    { logo: '/logo-monclova.png', name: 'Sponsor 1' },
    { logo: '/background.jpg', name: 'Sponsor 2' }
  ];
  torneos = [
    { nombre: 'Torneo Invierno', fecha: '2024-12-01' },
    { nombre: 'Torneo Primavera', fecha: '2025-03-15' }
  ];
  corredoresActivos = 24;
  cochesDestacados = [
    { img: '/background2.jpg', nombre: 'Coche 1' },
    { img: '/background3.jpg', nombre: 'Coche 2' }
  ];

  sponsorImages = [
    '/background.jpg',
    '/background2.jpg',
    '/background3.jpg',
    '/background4.jpg',
    '/backgroundAI.jpg',
    '/backgroundregistry.jpg',
    '/logo-monclova.png',
  ];
  currentSponsorIndex = 0;

  selectedTeamLogoFile: File | null = null;
  previewTeamLogoUrl: string | null = null;
  dataService = inject(DataService);
  authService = inject(AuthService);

  async ngOnInit() {
    await this.loadRealUserProfile();
  }

  async loadRealUserProfile() {
    const uid = this.authService.getUserId();
    if (!uid) return;
    const profile = await this.dataService.getDriverProfile(uid);
    if (profile) {
      this.userProfile = profile;
    }
  }

  nextSponsor() {
    this.currentSponsorIndex = (this.currentSponsorIndex + 1) % this.sponsorImages.length;
  }
  prevSponsor() {
    this.currentSponsorIndex = (this.currentSponsorIndex - 1 + this.sponsorImages.length) % this.sponsorImages.length;
  }

  onTeamLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedTeamLogoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewTeamLogoUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedTeamLogoFile);
    }
  }

  async uploadTeamLogo() {
    if (!this.selectedTeamLogoFile) return;
    const uid = this.authService.getUserId();
    if (!uid) {
      alert('No se pudo obtener el usuario actual.');
      return;
    }
    try {
      const url = await this.dataService.uploadTeamLogo(uid, this.selectedTeamLogoFile);
      await this.loadRealUserProfile();
      this.previewTeamLogoUrl = null;
      this.selectedTeamLogoFile = null;
      alert('¡Logo actualizado exitosamente!');
    } catch (err) {
      alert('Error al subir el logo: ' + ((err as any)?.message || err));
    }
  }
} 