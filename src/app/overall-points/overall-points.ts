import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-overall-points',
  templateUrl: './overall-points.html',
  styleUrl: './overall-points.css',
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class OverallPointsComponent implements OnInit {
  overallPoints: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadOverallPoints();
  }

  loadOverallPoints() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.dataService.getOverallPoints().subscribe({
      next: (points) => {
        this.overallPoints = points;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar los puntos generales';
        this.isLoading = false;
        console.error('Error loading overall points:', error);
      }
    });
  }
}
