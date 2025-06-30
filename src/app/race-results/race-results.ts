import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-race-results',
  templateUrl: './race-results.html',
  styleUrl: './race-results.css',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class RaceResultsComponent implements OnInit {
  raceResults: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadRaceResults();
  }

  loadRaceResults() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.dataService.getRaceResults().subscribe({
      next: (results) => {
        this.raceResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los resultados';
        this.isLoading = false;
        console.error('Error loading race results:', error);
      }
    });
  }
}
