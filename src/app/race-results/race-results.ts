import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth';
import { Subscription, of } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-race-results',
  templateUrl: './race-results.html',
  styleUrl: './race-results.css',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class RaceResultsComponent implements OnInit, OnDestroy {
  raceResults: any[] = [];
  isLoading = false;
  errorMessage = '';
  private sub: Subscription | null = null;
  isAdmin: boolean = false;
  userId: string | null = null;
  private adminSub: Subscription | null = null;
  stats = { avgRT: 0, avgET: 0, avgDialIn: 0, avgMaxSpeed: 0, breakoutPct: 0 };

  constructor(private dataService: DataService, private authService: AuthService) {}

  ngOnInit() {
    this.adminSub = this.authService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });
    this.isLoading = true;
    this.sub = this.authService.currentUser$
      .pipe(
        filter(user => !!user?.uid),
        switchMap(user => {
          this.userId = user!.uid;
          return this.dataService.getRaceResults().pipe(
            switchMap(results => of(this.filterResults(results)))
          );
        })
      )
      .subscribe({
        next: (filteredResults) => {
          this.raceResults = filteredResults;
          this.stats = this.calculateStats(filteredResults);
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Error al cargar los resultados';
          this.isLoading = false;
          console.error('Error loading race results:', error);
        }
      });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.adminSub) this.adminSub.unsubscribe();
  }

  filterResults(results: any[]): any[] {
    if (this.isAdmin) {
      return results;
    }
    return results.filter(r => r.driverId === this.userId);
  }

  refreshResults() {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.currentUser$.pipe(
      filter(user => !!user?.uid),
      switchMap(user => {
        this.userId = user!.uid;
        return this.dataService.getRaceResults().pipe(
          switchMap(results => of(this.filterResults(results)))
        );
      })
    ).subscribe({
      next: (filteredResults) => {
        this.raceResults = filteredResults;
        this.stats = this.calculateStats(filteredResults);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los resultados';
        this.isLoading = false;
        console.error('Error loading race results:', error);
      }
    });
  }

  calculateStats(results: any[]) {
    const n = results.length;
    if (n === 0) return { avgRT: 0, avgET: 0, avgDialIn: 0, avgMaxSpeed: 0, breakoutPct: 0 };
    return {
      avgRT: results.reduce((sum, r) => sum + (+r.reactionTime || 0), 0) / n,
      avgET: results.reduce((sum, r) => sum + (+r.elapsedTime || 0), 0) / n,
      avgDialIn: results.reduce((sum, r) => sum + (+r.dialIn || 0), 0) / n,
      avgMaxSpeed: results.reduce((sum, r) => sum + (+r.maxSpeed || 0), 0) / n,
      breakoutPct: results.filter(r => r.didBreakout).length / n
    };
  }
}
