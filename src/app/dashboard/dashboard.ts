import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth/auth';
import { DataService } from '../data.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: any = null;
  lastRaceResult: any = null;
  userProfile: any = null;
  isLoading = false;
  isAdmin$!: Observable<boolean>;

  // --- TEMPORIZADOR Y NOTIFICACIÓN ---
  activeMatchTimer: any = null; // { match, bracket, remaining, duration }
  timerInterval: any = null;
  showTimer: boolean = false;
  showToaster: boolean = false;
  toasterMessage: string = '';
  notifiedMatches: Set<string> = new Set();
  bracketsSub: Subscription | null = null;

  tournament: any = null;
  seasonPoints: number | null = null;
  tournamentPoints: number | null = null; // Placeholder para futuro
  tournamentsSub: Subscription | null = null;
  overallPointsSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router
  ) {
    this.isAdmin$ = this.authService.isAdmin$;
  }

  ngOnInit() {
    this.loadUserData();
    this.loadTournamentData();
    this.loadSeasonPoints();
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.bracketsSub) this.bracketsSub.unsubscribe();
    if (this.tournamentsSub) this.tournamentsSub.unsubscribe();
    if (this.overallPointsSub) this.overallPointsSub.unsubscribe();
  }

  private async loadUserData() {
    this.isLoading = true;
    
    try {
      // Obtener usuario actual
      this.authService.currentUser$.subscribe(async user => {
        this.user = user;
        if (user) {
          await this.loadUserProfile(user.uid);
          this.loadLastRaceResult(user.uid);
          // Reiniciar la escucha del temporizador después de cargar el perfil
          this.listenActiveMatchTimer();
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUserProfile(userId: string) {
    try {
      this.userProfile = await this.dataService.getCurrentUserProfile(userId);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  private async loadLastRaceResult(userId: string) {
    try {
      // Simular carga del último resultado
      // En una implementación real, esto vendría del DataService
      this.lastRaceResult = {
        raceName: 'Carrera Demo',
        position: 3,
        time: '1:23.456'
      };
    } catch (error) {
      console.error('Error loading last race result:', error);
    }
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goToResultados() {
    this.router.navigate(['/race-results']);
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  listenActiveMatchTimer() {
    // Limpiar suscripción anterior si existe
    if (this.bracketsSub) {
      this.bracketsSub.unsubscribe();
    }
    
    // Escuchar todos los brackets en tiempo real
    this.bracketsSub = this.dataService.getAllBracketsObservable().subscribe((brackets: any[]) => {
      if (!this.userProfile) {
        return;
      }
      
      let found = false;
      for (const bracket of brackets) {
        for (const match of bracket.matches || []) {
          if (
            (match.playerA?.id === this.userProfile.id || match.playerB?.id === this.userProfile.id) &&
            match.timerStartedAt && !match.winner
          ) {
            // Calcular tiempo restante
            const now = Date.now();
            const elapsed = Math.floor((now - match.timerStartedAt) / 1000);
            const remaining = Math.max(0, (match.timerDuration || 300) - elapsed);
            this.activeMatchTimer = { match, bracket, remaining, duration: match.timerDuration || 300 };
            this.showTimer = remaining > 0;
            
            // Lanzar toaster solo una vez por match
            if (!this.notifiedMatches.has(match.id)) {
              this.showToaster = true;
              this.toasterMessage = '¡Prepárate! El temporizador para tu carrera ha iniciado. Si no estás listo cuando termine el tiempo, serás descalificado automáticamente.';
              this.notifiedMatches.add(match.id);
              setTimeout(() => { this.showToaster = false; }, 8000);
            }
            
            // Iniciar intervalo para actualizar el temporizador
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
              const now2 = Date.now();
              const elapsed2 = Math.floor((now2 - match.timerStartedAt) / 1000);
              const remaining2 = Math.max(0, (match.timerDuration || 300) - elapsed2);
              this.activeMatchTimer.remaining = remaining2;
              this.showTimer = remaining2 > 0;
              if (remaining2 <= 0) {
                clearInterval(this.timerInterval);
              }
            }, 1000);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      
      if (!found) {
        this.activeMatchTimer = null;
        this.showTimer = false;
      }
    });
  }

  getTimerDisplay(): string {
    if (!this.activeMatchTimer) return '05:00';
    const min = Math.floor(this.activeMatchTimer.remaining / 60).toString().padStart(2, '0');
    const sec = (this.activeMatchTimer.remaining % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  private loadTournamentData() {
    this.tournamentsSub = this.dataService.getTournaments().subscribe(tournaments => {
      // Selecciona el torneo activo (no completado)
      this.tournament = tournaments.find((t: any) => t.currentStage && t.currentStage !== 'Completed') || null;
    });
  }

  private loadSeasonPoints() {
    this.overallPointsSub = this.dataService.getOverallPoints().subscribe(pointsArr => {
      if (!this.userProfile) return;
      const year = new Date().getFullYear();
      const userPoints = pointsArr.find((p: any) => p.driverProfileId === this.userProfile.id && p.seasonYear === year);
      this.seasonPoints = userPoints ? userPoints.totalSeasonPoints : 0;
    });
  }
}
