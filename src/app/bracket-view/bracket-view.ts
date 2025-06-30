import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../data.service';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-bracket-view',
  templateUrl: './bracket-view.html',
  styleUrl: './bracket-view.css',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class BracketViewComponent implements OnInit, OnDestroy {
  tournaments: any[] = [];
  selectedTournament: string = '';
  brackets: any[] = [];
  selectedBracket: any = null;
  isLoading = false;
  errorMessage: string = '';
  isAdmin = false;
  isAdmin$: Observable<boolean>;
  currentUser: any = null;
  successMessage = '';

  categories: string[] = [];
  selectedCategory: string = '';
  bracketRounds: any[] = [];

  // --- TEMPORIZADOR POR MATCH PERSISTENTE ---
  timerState: { [matchId: string]: { remaining: number, running: boolean, finished: boolean, interval?: any } } = {};
  readonly TIMER_DURATION = 300; // 5 minutos en segundos

  constructor(private dataService: DataService, private authService: AuthService) {
    this.isAdmin$ = this.authService.isAdmin$;
  }

  ngOnInit() {
    this.loadTournaments();
    this.isAdmin$.subscribe(val => this.isAdmin = val);
  }

  private loadTournaments() {
    this.isLoading = true;
    this.dataService.getTournaments().subscribe({
      next: (tournaments) => {
        this.tournaments = tournaments;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar torneos';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  fetchBrackets() {
    if (!this.selectedTournament) {
      this.brackets = [];
      this.selectedBracket = null;
      this.categories = [];
      this.selectedCategory = '';
      this.bracketRounds = [];
      return;
    }
    this.isLoading = true;
    this.dataService.getTournamentBrackets(this.selectedTournament).subscribe({
      next: (brackets) => {
        this.brackets = brackets;
        this.selectedBracket = brackets.length > 0 ? brackets[0] : null;
        this.successMessage = brackets.length === 0 ? 'No hay brackets para este torneo.' : '';
        this.categories = Array.from(new Set(brackets.map(b => b.category).filter(Boolean)));
        this.selectedCategory = this.categories.length > 0 ? this.categories[0] : '';
        this.processBracketRounds();
        this.syncTimerStates(); // Sincronizar estados de temporizador
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar brackets';
        this.isLoading = false;
      }
    });
  }

  selectBracket(bracket: any) {
    this.selectedBracket = bracket;
    this.successMessage = '';
    this.processBracketRounds();
    this.syncTimerStates(); // Sincronizar estados de temporizador
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    const bracket = this.brackets.find(b => b.category === cat);
    if (bracket) {
      this.selectedBracket = bracket;
      this.processBracketRounds();
      this.syncTimerStates(); // Sincronizar estados de temporizador
    }
  }

  processBracketRounds() {
    if (!this.selectedBracket || !this.selectedBracket.matches) {
      this.bracketRounds = [];
      return;
    }
    const roundsMap: { [key: string]: any[] } = {};
    for (const match of this.selectedBracket.matches) {
      const round = match.round || 1;
      if (!roundsMap[round]) roundsMap[round] = [];
      roundsMap[round].push(match);
    }
    this.bracketRounds = Object.keys(roundsMap)
      .sort((a, b) => +a - +b)
      .map(roundNumber => ({
        roundNumber,
        matches: roundsMap[roundNumber]
      }));
  }

  async updateMatch(match: any, score1: number, score2: number, winnerId: string) {
    if (!this.selectedBracket) return;
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    try {
      await this.dataService.updateMatchResult(this.selectedBracket.id, match.id, score1, score2, winnerId);
      this.successMessage = 'Match actualizado correctamente';
      this.fetchBrackets();
    } catch (err: any) {
      this.errorMessage = err.message || 'Error al actualizar el match';
    } finally {
      this.isLoading = false;
    }
  }

  // Método para verificar si un match está deshabilitado
  isMatchDisabled(match: any): boolean {
    return !!match.winner || this.bracketRounds.some(r => r.roundNumber > match.round);
  }

  // Método para verificar si hay un ganador en un match
  hasWinner(match: any): boolean {
    return !!match.winner;
  }

  // Método para verificar si un jugador es el ganador
  isWinner(match: any, playerId: string): boolean {
    return match.winner?.id === playerId;
  }

  // Método para obtener el score de un jugador
  getPlayerScore(match: any, playerNumber: number): string {
    const score = playerNumber === 1 ? match.score1 : match.score2;
    return score ?? '-';
  }

  // Método para verificar si hay datos adicionales del match
  hasMatchDetails(match: any): boolean {
    return !!(match.playerA?.carNumber || match.playerB?.carNumber);
  }

  // Método para verificar si hay datos de tiempo/velocidad
  hasPerformanceData(match: any): boolean {
    return !!(match.elapsedTime || match.maxSpeed);
  }

  // Método para verificar si hay un campeón
  hasChampion(): boolean {
    return !!(this.selectedBracket && this.selectedBracket.champion);
  }

  // Método para verificar si hay brackets disponibles
  hasBrackets(): boolean {
    return this.brackets.length > 0;
  }

  // Método para verificar si hay múltiples categorías
  hasMultipleCategories(): boolean {
    return this.categories && this.categories.length > 1;
  }

  // Método para obtener la descripción limpia del bracket sin redundancia
  getCleanDescription(bracket: any): string {
    if (!bracket || !bracket.description) return '';
    
    // Si la descripción contiene la categoría al inicio, la removemos
    const category = bracket.category;
    if (category && bracket.description.toLowerCase().startsWith(category.toLowerCase())) {
      // Removemos la categoría del inicio de la descripción
      const cleanDesc = bracket.description.substring(category.length).trim();
      // Removemos cualquier separador como ":", "-", etc. al inicio
      return cleanDesc.replace(/^[:\-\s]+/, '');
    }
    
    return bracket.description;
  }

  async startTimer(match: any) {
    if (!match?.id || !this.selectedBracket?.id) return;
    const now = Date.now();
    // Llama a updateMatchResult con timerStart para guardar en Firestore
    await this.dataService.updateMatchResult(this.selectedBracket.id, match.id, match.score1 || 0, match.score2 || 0, match.winner?.id || '', now);
    // El temporizador se sincronizará automáticamente por la suscripción a Firestore
  }

  runTimerInterval(matchId: string) {
    this.clearTimerInterval(matchId);
    this.timerState[matchId].interval = setInterval(() => {
      // Buscar el match actual en el bracket seleccionado
      const match = this.selectedBracket?.matches?.find((m: any) => m.id === matchId);
      if (!match || !match.timerStartedAt || match.winner) {
        this.clearTimerInterval(matchId);
        delete this.timerState[matchId];
        return;
      }
      
      const now = Date.now();
      const elapsed = Math.floor((now - match.timerStartedAt) / 1000);
      const remaining = Math.max(0, (match.timerDuration || this.TIMER_DURATION) - elapsed);
      
      this.timerState[matchId] = {
        ...this.timerState[matchId],
        remaining,
        running: remaining > 0,
        finished: remaining <= 0
      };
      
      if (remaining <= 0) {
        this.clearTimerInterval(matchId);
      }
    }, 1000);
  }

  clearTimerInterval(matchId: string) {
    if (this.timerState[matchId]?.interval) {
      clearInterval(this.timerState[matchId].interval);
      this.timerState[matchId].interval = null;
    }
  }

  getTimerDisplay(match: any): string {
    const state = this.timerState[match.id];
    if (!state) return '05:00';
    const min = Math.floor(state.remaining / 60).toString().padStart(2, '0');
    const sec = (state.remaining % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  isTimerRunning(match: any): boolean {
    return !!this.timerState[match.id]?.running;
  }

  isTimerFinished(match: any): boolean {
    return !!this.timerState[match.id]?.finished;
  }

  // Método para verificar si el temporizador fue iniciado (tiene timerStartedAt en Firestore)
  hasTimerStarted(match: any): boolean {
    return !!(match.timerStartedAt);
  }

  areWinnerButtonsEnabled(match: any): boolean {
    // Solo habilitar si el temporizador terminó y no hay ganador
    return this.isTimerFinished(match) && !this.hasWinner(match);
  }

  ngOnDestroy() {
    // Limpiar todos los intervalos
    Object.keys(this.timerState).forEach(id => this.clearTimerInterval(id));
  }

  // Nuevo método para sincronizar estados de temporizador desde Firestore
  syncTimerStates() {
    if (!this.selectedBracket?.matches) return;
    
    this.selectedBracket.matches.forEach((match: any) => {
      if (match.timerStartedAt && !match.winner) {
        const now = Date.now();
        const elapsed = Math.floor((now - match.timerStartedAt) / 1000);
        const remaining = Math.max(0, (match.timerDuration || this.TIMER_DURATION) - elapsed);
        
        this.timerState[match.id] = {
          remaining,
          running: remaining > 0,
          finished: remaining <= 0,
          interval: this.timerState[match.id]?.interval
        };
        
        // Iniciar intervalo si el temporizador está corriendo
        if (remaining > 0 && !this.timerState[match.id].interval) {
          this.runTimerInterval(match.id);
        }
      } else {
        // Limpiar estado si no hay temporizador activo
        this.clearTimerInterval(match.id);
        delete this.timerState[match.id];
      }
    });
  }
}
