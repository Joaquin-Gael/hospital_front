import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
})
export class StatisticsComponent implements OnInit {
  public statCards: StatCard[] = [];
  public timeFilter: TimeFilter = TimeFilter.Month;
  public timeFilterEnum = TimeFilter;
  public isLoading = false;

  public patientsChartOptions!: ChartOptions;
  public appointmentsChartOptions!: ChartOptions;
  public diagnosesChartOptions!: ChartOptions;
  public satisfactionChartOptions!: ChartOptions;

  ngOnInit(): void {
    this.loadStatCards();
    this.initChartData();
  }

  loadStatCards(): void {
    this.statCards = [
      {
        title: 'Pacientes Atendidos',
        value: 128,
        unit: 'pacientes',
        change: 12.5,
        icon: 'icon-users',
        color: '#4C6FFF',
      },
      {
        title: 'Citas Programadas',
        value: 42,
        unit: 'citas',
        change: -5.2,
        icon: 'icon-calendar',
        color: '#FF6B6B',
      },
      {
        title: 'Tiempo Promedio',
        value: 24,
        unit: 'minutos',
        change: 3.8,
        icon: 'icon-clock',
        color: '#33C863',
      },
      {
        title: 'Ingresos',
        value: 8450,
        unit: '€',
        change: 15.3,
        icon: 'icon-trending-up',
        color: '#FFAB2D',
      },
    ];
  }

  initChartData(): void {
    this.isLoading = true;
    setTimeout(() => {
      const labels = this.getLabelsForRange();

      this.patientsChartOptions = {
        series: [{ name: 'Pacientes', data: this.generateRandomData(labels.length, 50, 150) }],
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
          categories: labels,
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

      this.appointmentsChartOptions = {
        series: [
          { name: 'Programadas', data: this.generateRandomData(labels.length, 15, 30) },
          { name: 'Completadas', data: this.generateRandomData(labels.length, 10, 25) },
          { name: 'Canceladas', data: this.generateRandomData(labels.length, 0, 5) },
        ],
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
          categories: labels,
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

      this.diagnosesChartOptions = {
        series: [35, 25, 15, 10, 15],
        labels: ['Hipertensión', 'Diabetes', 'Gripe', 'Ansiedad', 'Artritis'],
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
        series: [{ name: 'Satisfacción', data: this.generateRandomData(labels.length, 85, 98) }],
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
          categories: labels,
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

      this.isLoading = false;
    }, 1000);
  }

  getLabelsForRange(): string[] {
    switch (this.timeFilter) {
      case TimeFilter.Day:
        return Array.from({ length: 13 }, (_, i) => `${i + 8}:00`);
      case TimeFilter.Week:
        return ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      case TimeFilter.Month:
        return Array.from({ length: 15 }, (_, i) => `${i * 2 + 1}`);
      case TimeFilter.Year:
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      default:
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }
  }

  generateRandomData(length: number, min: number, max: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }

  changeTimeFilter(filter: TimeFilter): void {
    this.timeFilter = filter;
    this.initChartData();
  }

  getChangeLabel(change: number): string {
    if (change === 0) return 'Sin cambios';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}% vs. anterior`;
  }
}