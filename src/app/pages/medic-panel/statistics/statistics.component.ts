import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { DoctorService } from '../../../services/doctor/doctor.service'
import { DoctorStatsResponse } from '../../../services/interfaces/doctor.interfaces';
import { DoctorDataService } from '../medic-panel/doctor-data.service';
import { Observable, Subject, takeUntil, switchMap, catchError, of } from 'rxjs';

interface StatCard {
  title: string;
  value: number;
  unit: string;
  change: number;
  icon: string;
  color: string;
}

enum TimeFilter {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}

export type ChartOptions = {
  series: ApexAxisChartSeries | number[];
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  fill: ApexFill;
  yaxis: ApexYAxis | ApexYAxis[];
  xaxis: ApexXAxis;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  grid: ApexGrid;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  labels?: string[];
};

interface RecentActivityRow {
  patient: string;
  service: string;
  date: string;
  status: string;
  income: string;
}

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
})
export class StatisticsComponent implements OnInit, OnDestroy {
  public statCards: StatCard[] = [];
  public timeFilter: TimeFilter = TimeFilter.Month;
  public timeFilterEnum = TimeFilter;
  public isLoading = false;
  public recentActivity: RecentActivityRow[] = [];

  public patientsChartOptions!: ChartOptions;
  public appointmentsChartOptions!: ChartOptions;
  public diagnosesChartOptions!: ChartOptions;
  public satisfactionChartOptions!: ChartOptions;
  
  private response?: DoctorStatsResponse;
  private readonly doctorService = inject(DoctorService)
  private readonly doctorDataService = inject(DoctorDataService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.doctorDataService.getDoctor()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(doctor => {
          if (!doctor || !doctor.id) {
            throw new Error('No se encontró el ID del doctor');
          }
          return this.loadStatData(doctor.id);
        }),
        catchError(err => {
          console.error('Error al cargar datos:', err);
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.response = response;
          this.mapResponseToUI();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadStatData(doctorId: string): Observable<DoctorStatsResponse> {
    this.isLoading = true;
    return this.doctorService.getDoctorStats(doctorId);
  }

  private mapResponseToUI(): void {
    if (!this.response) return;

    const currentDay = new Date().getDate();
    const pipe = this.response.turns_per_month.pipe_chart;
    const card = this.response.turns_per_month.card;

    // Filtrar índices basados en timeFilter
    let filteredIndices = pipe.day.map((d, i) => i).filter(i => {
      const d = pipe.day[i];
      switch (this.timeFilter) {
        case TimeFilter.Day:
          return d === currentDay;
        case TimeFilter.Week:
          return d >= currentDay - 6 && d <= currentDay;
        case TimeFilter.Month:
          return true;
        case TimeFilter.Year:
          return true;
        default:
          return true;
      }
    });

    // Calcular sumas para statCards
    let totalTurns = 0;
    let finishedTurns = 0;
    filteredIndices.forEach(i => {
      totalTurns += pipe.total_turns[i];
      if (pipe.state[i] === 'finished') {
        finishedTurns += pipe.total_turns[i];
      }
    });

    const growth = this.timeFilter === TimeFilter.Month ? (card.monthly_growth || 0) : 0;

    this.statCards = [
      {
        title: 'Pacientes Atendidos',
        value: finishedTurns,
        unit: 'pacientes',
        change: growth,
        icon: 'icon-users',
        color: '#4C6FFF',
      },
      {
        title: 'Citas Programadas',
        value: totalTurns,
        unit: 'citas',
        change: growth,
        icon: 'icon-calendar',
        color: '#FF6B6B',
      },
      {
        title: 'Tiempo Promedio',
        value: 0,
        unit: 'minutos',
        change: 0,
        icon: 'icon-clock',
        color: '#33C863',
      },
      {
        title: 'Ingresos',
        value: 0,
        unit: '€',
        change: 0,
        icon: 'icon-trending-up',
        color: '#FFAB2D',
      },
    ];

    // Agregación para gráficos
    const filteredDays = filteredIndices.map(i => pipe.day[i]);
    const uniqueDays = [...new Set(filteredDays)].sort((a, b) => a - b);
    const uniqueStates = [...new Set(pipe.state)];

    // Para patientsChartOptions (finished per day)
    const patientsData: number[] = uniqueDays.map(day => {
      let sum = 0;
      filteredIndices.forEach(i => {
        if (pipe.day[i] === day && pipe.state[i] === 'finished') {
          sum += pipe.total_turns[i];
        }
      });
      return sum;
    });

    this.patientsChartOptions = {
      series: [{ name: 'Pacientes', data: patientsData }],
      chart: {
        type: 'area',
        height: 350,
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
        },
      },
      markers: {
        size: 4,
        colors: ['#fff'],
        strokeColors: '#4C6FFF',
        strokeWidth: 2,
        hover: { size: 6 },
      },
      xaxis: {
        categories: uniqueDays.map(d => d.toString()),
        labels: { style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" },
          formatter: (value: number) => Math.round(value).toString(),
        },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { top: 0, right: 0, bottom: 0, left: 10 },
      },
      tooltip: {
        theme: 'light',
        x: { format: 'dd MMM yyyy' },
        y: { formatter: (val: number) => `${val} pacientes` },
        style: { fontSize: '12px', fontFamily: "'Inter', sans-serif" },
      },
      legend: { show: false },
      plotOptions: {},
    };

    // Para appointmentsChartOptions (per state per day)
    const appointmentsSeries = uniqueStates.map(state => {
      const data: number[] = uniqueDays.map(day => {
        let sum = 0;
        filteredIndices.forEach(i => {
          if (pipe.day[i] === day && pipe.state[i] === state) {
            sum += pipe.total_turns[i];
          }
        });
        return sum;
      });
      return { name: state, data };
    });

    this.appointmentsChartOptions = {
      series: appointmentsSeries,
      chart: {
        type: 'bar',
        height: 350,
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      markers: { size: 0 },
      xaxis: {
        categories: uniqueDays.map(d => d.toString()),
        labels: { style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" } },
      },
      fill: { opacity: 1 },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { top: 0, right: 0, bottom: 0, left: 10 },
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => `${val} citas` },
        style: { fontSize: '12px', fontFamily: "'Inter', sans-serif" },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        offsetY: -8,
        fontSize: '13px',
        fontFamily: "'Inter', sans-serif",
        markers: { fillColors: ['#4C6FFF', '#38b000', '#ffab2d'] },
        itemMargin: { horizontal: 10, vertical: 0 },
      },
    };

    // Diagnoses y Satisfaction sin datos
    this.diagnosesChartOptions = {
      series: [],
      labels: [],
      chart: {
        type: 'donut',
        height: 350,
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: { fontSize: '16px', fontFamily: "'Inter', sans-serif", fontWeight: 600, offsetY: -10 },
              value: {
                fontSize: '20px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                offsetY: 10,
                formatter: (val: string | number) => `${val}%`,
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: '#64748b',
                formatter: (w: any) => `${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)}%`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      fill: { opacity: 1 },
      tooltip: { theme: 'light', style: { fontSize: '12px', fontFamily: "'Inter', sans-serif" } },
      legend: {
        position: 'bottom',
        fontSize: '13px',
        fontFamily: "'Inter', sans-serif",
        markers: { fillColors: ['#4C6FFF', '#4361ee', '#38b000', '#ffab2d', '#ff5a5f'] },
        itemMargin: { horizontal: 10, vertical: 5 },
      },
      markers: { size: 0 },
      xaxis: { labels: { show: false } },
      yaxis: { labels: { show: false } },
      grid: { show: false },
    };

    this.satisfactionChartOptions = {
      series: [{ name: 'Satisfacción', data: [] }],
      chart: {
        type: 'line',
        height: 350,
        fontFamily: "'Inter', sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'straight', width: 3 },
      fill: {
        type: 'solid',
        opacity: 0.8,
      },
      markers: {
        size: 5,
        colors: ['#fff'],
        strokeColors: '#38b000',
        strokeWidth: 2,
        hover: { size: 7 },
      },
      xaxis: {
        categories: [],
        labels: { style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 70,
        max: 100,
        labels: {
          style: { colors: '#64748b', fontSize: '12px', fontFamily: "'Inter', sans-serif" },
          formatter: (val: number) => `${val}%`,
        },
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { top: 0, right: 0, bottom: 0, left: 10 },
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => `${val}%` },
        style: { fontSize: '12px', fontFamily: "'Inter', sans-serif" },
      },
      legend: { show: false },
      plotOptions: {},
    };

    // Sin datos para recentActivity
    this.recentActivity = [];

    this.isLoading = false;
  }

  changeTimeFilter(filter: TimeFilter): void {
    this.timeFilter = filter;
    this.mapResponseToUI();
  }

  getChangeLabel(change: number): string {
    if (change === 0) return 'Sin cambios';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}% vs. anterior`;
  }
}