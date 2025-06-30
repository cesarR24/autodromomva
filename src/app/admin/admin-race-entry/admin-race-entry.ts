import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth';
import { DataService } from '../../data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tournamentFilter', standalone: true })
export class TournamentFilterPipe implements PipeTransform {
  transform(tournaments: any[], search: string): any[] {
    if (!search) return tournaments;
    return tournaments.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }
}

@Component({
  selector: 'app-admin-race-entry',
  templateUrl: './admin-race-entry.html',
  styleUrl: './admin-race-entry.css',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, TournamentFilterPipe]
})
export class AdminRaceEntryComponent implements OnInit {
  raceForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  currentUser: any = null;

  // Bracket management
  driverProfiles: any[] = [];
  selectedDrivers: Set<string> = new Set();
  bracketName = '';
  bracketDescription = '';
  brackets: any[] = [];
  isBracketLoading = false;
  bracketError = '';
  bracketSuccess = '';
  editingBracketId: string | null = null;

  tournaments: any[] = [];
  selectedTournament: string = '';

  tournamentName = '';
  tournamentDescription = '';
  tournamentError = '';
  tournamentSuccess = '';

  tournamentSearch: string = '';

  // --- NUEVO: Control de pestañas y filtros para resultados manuales ---
  activeTab: string = 'resultados';
  filteredPlayers: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    this.raceForm = this.fb.group({
      eventName: ['', Validators.required],
      carNumber: ['', [Validators.required, Validators.min(1)]],
      elapsedTime: ['', Validators.required],
      maxSpeed: ['', Validators.required],
      trackCondition: ['', Validators.required],
      temperature: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadDriverProfiles();
    this.loadBrackets();
    this.loadTournaments();
    this.initRaceForm();
  }

  // Inicializar el formulario de resultados manuales con los nuevos campos
  initRaceForm() {
    this.raceForm = this.fb.group({
      winnerId: ['', Validators.required],
      elapsedTime: ['', Validators.required],
      maxSpeed: ['', Validators.required]
    });
  }

  // --- Bracket logic ---
  loadDriverProfiles() {
    this.isBracketLoading = true;
    this.dataService.getAllDriverProfiles().then(profiles => {
      this.driverProfiles = profiles;
      this.isBracketLoading = false;
    }).catch(err => {
      this.bracketError = 'Error al cargar pilotos';
      this.isBracketLoading = false;
    });
  }

  toggleDriverSelection(driverId: string) {
    if (this.selectedDrivers.has(driverId)) {
      this.selectedDrivers.delete(driverId);
    } else {
      this.selectedDrivers.add(driverId);
    }
  }

  loadTournaments() {
    this.dataService.getTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar torneos';
      }
    });
  }

  async createBracket() {
    if (this.selectedDrivers.size < 2 || !this.selectedTournament) return;
    this.isBracketLoading = true;
    this.bracketError = '';
    this.bracketSuccess = '';
    try {
      const participants = this.driverProfiles
        .filter(d => this.selectedDrivers.has(d.id))
        .map(d => ({ id: d.id, name: d.name || d.email || d.id }));
      await this.dataService.createBracket(participants, this.bracketName, this.bracketDescription, this.selectedTournament);
      this.bracketSuccess = 'Bracket creado exitosamente';
      this.selectedDrivers.clear();
      this.bracketName = '';
      this.bracketDescription = '';
      this.loadBrackets();
    } catch (err: any) {
      this.bracketError = err.message || 'Error al crear bracket';
    } finally {
      this.isBracketLoading = false;
    }
  }

  loadBrackets() {
    this.isBracketLoading = true;
    this.dataService.getAllBrackets().then(brackets => {
      this.brackets = brackets;
      this.isBracketLoading = false;
    }).catch(err => {
      this.bracketError = 'Error al cargar brackets';
      this.isBracketLoading = false;
    });
  }

  async deleteBracket(bracketId: string) {
    if (!confirm('¿Eliminar este bracket?')) return;
    this.isBracketLoading = true;
    try {
      await this.dataService.deleteBracket(bracketId);
      this.loadBrackets();
    } catch (err: any) {
      this.bracketError = err.message || 'Error al eliminar bracket';
    } finally {
      this.isBracketLoading = false;
    }
  }

  startEditBracket(bracket: any) {
    this.editingBracketId = bracket.id;
    this.bracketName = bracket.name;
    this.bracketDescription = bracket.description;
    this.selectedDrivers = new Set(bracket.matches.flatMap((m: any) => [m.playerA?.id, m.playerB?.id].filter(Boolean)));
  }

  async saveEditBracket() {
    if (!this.editingBracketId) return;
    this.isBracketLoading = true;
    try {
      const participants = this.driverProfiles
        .filter(d => this.selectedDrivers.has(d.id))
        .map(d => ({ id: d.id, name: d.name || d.email || d.id }));
      await this.dataService.updateBracket(this.editingBracketId, this.bracketName, this.bracketDescription, participants);
      this.editingBracketId = null;
      this.bracketName = '';
      this.bracketDescription = '';
      this.selectedDrivers.clear();
      this.loadBrackets();
    } catch (err: any) {
      this.bracketError = err.message || 'Error al editar bracket';
    } finally {
      this.isBracketLoading = false;
    }
  }

  cancelEditBracket() {
    this.editingBracketId = null;
    this.bracketName = '';
    this.bracketDescription = '';
    this.selectedDrivers.clear();
  }

  async onSubmit() {
    if (this.raceForm.valid) {
      this.isLoading = true;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        const formData = this.raceForm.value;
        const piloto = this.driverProfiles.find(p => p.id === formData.winnerId);
        const raceResult = {
          ...formData,
          driverName: piloto ? piloto.name : '',
          timestamp: new Date().toISOString(),
          id: Date.now().toString()
        };

        console.log('Enviando datos al servidor:', raceResult);
        await this.dataService.addRaceResult(raceResult);
        this.successMessage = 'Resultado de carrera agregado exitosamente';
        this.raceForm.reset();
      } catch (error: any) {
        console.error('Error completo:', error);
        this.errorMessage = `Error al agregar el resultado: ${error.message || 'Error desconocido'}`;
        
        // Mostrar información adicional para debug
        if (error.code) {
          this.errorMessage += ` (Código: ${error.code})`;
        }
      } finally {
        this.isLoading = false;
      }
    }
  }

  async createTournament() {
    if (!this.tournamentName) return;
    this.tournamentError = '';
    this.tournamentSuccess = '';
    try {
      await this.dataService.createTournament(this.tournamentName, this.tournamentDescription);
      this.tournamentSuccess = 'Torneo creado exitosamente';
      this.tournamentName = '';
      this.tournamentDescription = '';
      this.loadTournaments();
    } catch (err: any) {
      this.tournamentError = err.message || 'Error al crear torneo';
    }
  }

  selectTournament(id: string) {
    if (this.selectedTournament !== id) {
      this.selectedTournament = id;
      this.isBracketLoading = true;
      // Aquí puedes recargar los brackets filtrados por torneo si aplica
      setTimeout(() => {
        this.isBracketLoading = false;
      }, 800);
    }
  }

  // Devuelve un array de nombres únicos de los participantes de un bracket
  getUniqueBracketParticipants(bracket: any): string[] {
    const names = new Set<string>();
    if (bracket && bracket.matches) {
      for (const m of bracket.matches) {
        if (m.playerA?.name) names.add(m.playerA.name);
        if (m.playerB?.name) names.add(m.playerB.name);
      }
    }
    return Array.from(names);
  }
}
