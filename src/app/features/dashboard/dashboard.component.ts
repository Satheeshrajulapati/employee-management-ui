import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { DatePipe } from '@angular/common';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import { finalize } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';

import {
  ChartConfiguration,
  ChartData
} from 'chart.js';

import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables
} from 'ng2-charts';

import {
  DashboardService
} from '../../core/services/dashboard.service';

import {
  DashboardStats
} from '../../core/models/dashboard.model';

import {
  LoadingSpinnerComponent
} from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    MatIconModule,
    LoadingSpinnerComponent,
    BaseChartDirective
  ],
  providers: [
    provideCharts(
      withDefaultRegisterables()
    )
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private readonly dashboardService =
    inject(DashboardService);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly stats =
    signal<DashboardStats | null>(null);

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal('');

  /*
   * Employees by Department
   * Doughnut Chart
   */

  readonly departmentChartType:
    'doughnut' = 'doughnut';

  readonly departmentChartData =
    signal<ChartData<'doughnut'>>({
      labels: [],
      datasets: [
        {
          data: []
        }
      ]
    });

  readonly departmentChartOptions:
    ChartConfiguration<'doughnut'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            padding: 18
          }
        },
        tooltip: {
          enabled: true
        }
      }
    };

  /*
   * Employee Joining Trend
   * Line Chart
   */

  readonly joiningChartType:
    'line' = 'line';

  readonly joiningChartData =
    signal<ChartData<'line'>>({
      labels: [],
      datasets: [
        {
          label: 'Employees Joined',
          data: [],
          tension: 0.35,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    });

  readonly joiningChartOptions:
    ChartConfiguration<'line'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1
          }
        }
      }
    };

  /*
   * Department Overview
   * Bar Chart
   */

  readonly departmentBarChartType:
    'bar' = 'bar';

  readonly departmentBarChartData =
    signal<ChartData<'bar'>>({
      labels: [],
      datasets: [
        {
          label: 'Employees',
          data: []
        }
      ]
    });

  readonly departmentBarChartOptions:
    ChartConfiguration<'bar'>['options'] = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            stepSize: 1
          }
        }
      }
    };

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService
      .getDashboardStats()
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe({
        next: response => {

          this.stats.set(response);

          this.buildDepartmentCharts(
            response
          );

          this.buildJoiningChart(
            response
          );
        },

        error: () => {
          this.errorMessage.set(
            'Unable to load dashboard data'
          );
        }
      });
  }

  /*
   * Both department charts use the
   * same API data.
   */

  private buildDepartmentCharts(
    dashboard: DashboardStats
  ): void {

    const labels =
      dashboard.employeesByDepartment
        .map(item =>
          item.department
        );

    const data =
      dashboard.employeesByDepartment
        .map(item =>
          item.employeeCount
        );

    this.departmentChartData.set({
      labels,
      datasets: [
        {
          data
        }
      ]
    });

    this.departmentBarChartData.set({
      labels,
      datasets: [
        {
          label: 'Employees',
          data
        }
      ]
    });
  }

  private buildJoiningChart(
    dashboard: DashboardStats
  ): void {

    const labels =
      dashboard.joiningTrend
        .map(item =>
          this.formatMonth(
            item.year,
            item.month
          )
        );

    const data =
      dashboard.joiningTrend
        .map(item =>
          item.employeeCount
        );

    this.joiningChartData.set({
      labels,
      datasets: [
        {
          label: 'Employees Joined',
          data,
          tension: 0.35,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    });
  }

  private formatMonth(
    year: number,
    month: number
  ): string {

    return new Date(
      year,
      month - 1,
      1
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        year: 'numeric'
      }
    );
  }

  getInitial(
    name: string
  ): string {

    if (!name) {
      return '?';
    }

    return name
      .charAt(0)
      .toUpperCase();
  }
}