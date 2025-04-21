import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import ApexCharts from 'apexcharts';

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

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class StatisticsComponent implements OnInit, AfterViewInit {
  @ViewChild('patientsChart') patientsChartElement!: ElementRef;
  @ViewChild('appointmentsChart') appointmentsChartElement!: ElementRef;
  @ViewChild('diagnosesChart') diagnosesChartElement!: ElementRef;
  @ViewChild('satisfactionChart') satisfactionChartElement!: ElementRef;

  public statCards: StatCard[] = [];
  public timeFilter: TimeFilter = TimeFilter.Month;
  public isLoading = false;
  public timeFilterEnum = TimeFilter;

  private patientsChart?: ApexCharts;
  private appointmentsChart?: ApexCharts;
  private diagnosesChart?: ApexCharts;
  private satisfactionChart?: ApexCharts;

  private patientsOptions: any;
  private appointmentsOptions: any;
  private diagnosesOptions: any;
  private satisfactionOptions: any;

  ngOnInit(): void {
    this.loadStatCards();
    this.updateChartData();
  }

  ngAfterViewInit(): void {
    if (this.patientsChartElement && this.patientsOptions) {
      this.patientsChart = new ApexCharts(this.patientsChartElement.nativeElement, this.patientsOptions);
      this.patientsChart.render();
    }

    if (this.appointmentsChartElement && this.appointmentsOptions) {
      this.appointmentsChart = new ApexCharts(this.appointmentsChartElement.nativeElement, this.appointmentsOptions);
      this.appointmentsChart.render();
    }

    if (this.diagnosesChartElement && this.diagnosesOptions) {
      this.diagnosesChart = new ApexCharts(this.diagnosesChartElement.nativeElement, this.diagnosesOptions);
      this.diagnosesChart.render();
    }

    if (this.satisfactionChartElement && this.satisfactionOptions) {
      this.satisfactionChart = new ApexCharts(this.satisfactionChartElement.nativeElement, this.satisfactionOptions);
      this.satisfactionChart.render();
    }
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

  updateChartData(): void {
    this.isLoading = true;

    setTimeout(() => {
      const labels = this.getLabelsForRange();

      this.patientsOptions = {
        series: [{ name: 'Pacientes', data: this.generateRandomData(labels.length, 50, 150) }],
        chart: {
          height: 350,
          type: 'area',
          fontFamily: "'Inter', sans-serif",
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#4C6FFF'],
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
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
            formatter: (value: number): string => Math.round(value).toString(),
          },
        },
        grid: {
          borderColor: '#e2e8f0',
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        tooltip: {
          theme: 'light',
          x: { format: 'dd MMM yyyy' },
          y: {
            formatter: (val: number): string => `${val} pacientes`,
          },
          style: {
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          },
        },
        legend: { show: false },
      };

      this.appointmentsOptions = {
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
          stacked: false,
        },
        plotOptions: {
          bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 },
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ['transparent'] },
        colors: ['#4C6FFF', '#38b000', '#ffab2d'],
        xaxis: {
          categories: labels,
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
          },
        },
        fill: { opacity: 1 },
        grid: {
          borderColor: '#e2e8f0',
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: (val: number): string => `${val} citas`,
          },
          style: {
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'right',
          offsetY: -8,
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          markers: {
            fillColors: ['#4C6FFF', '#38b000', '#ffab2d'],
          },
          itemMargin: { horizontal: 10, vertical: 0 },
        },
      };

      this.diagnosesOptions = {
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
                name: {
                  show: true,
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  offsetY: -10,
                },
                value: {
                  show: true,
                  fontSize: '20px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  offsetY: 10,
                  formatter: (val: string | number): string => `${val}%`,
                },
                total: {
                  show: true,
                  label: 'Total',
                  fontSize: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  color: '#64748b',
                  formatter: (w: any): string =>
                    `${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)}%`,
                },
              },
            },
          },
        },
        colors: ['#4C6FFF', '#4361ee', '#38b000', '#ffab2d', '#ff5a5f'],
        dataLabels: { enabled: false },
        legend: {
          position: 'bottom',
          fontSize: '13px',
          fontFamily: "'Inter', sans-serif",
          markers: {
            fillColors: ['#4C6FFF', '#4361ee', '#38b000', '#ffab2d', '#ff5a5f'],
          },
          itemMargin: { horizontal: 10, vertical: 5 },
        },
        tooltip: {
          theme: 'light',
          style: {
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          },
        },
        stroke: { width: 0 },
        fill: { opacity: 1 },
      };

      this.satisfactionOptions = {
        series: [{ name: 'Satisfacción', data: this.generateRandomData(labels.length, 85, 98) }],
        chart: {
          height: 350,
          type: 'line',
          fontFamily: "'Inter', sans-serif",
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'straight', width: 3 },
        colors: ['#38b000'],
        markers: {
          size: 5,
          colors: ['#fff'],
          strokeColors: '#38b000',
          strokeWidth: 2,
          hover: { size: 7 },
        },
        xaxis: {
          categories: labels,
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          min: 70,
          max: 100,
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
            },
            formatter: (val: number): string => `${val}%`,
          },
        },
        grid: {
          borderColor: '#e2e8f0',
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: true } },
          padding: { top: 0, right: 0, bottom: 0, left: 10 },
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: (val: number): string => `${val}%`,
          },
          style: {
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          },
        },
        legend: { show: false },
      };

      this.isLoading = false;

      // Actualizamos los gráficos si ya están renderizados
      if (this.patientsChart) {
        this.patientsChart.updateOptions(this.patientsOptions);
      }
      if (this.appointmentsChart) {
        this.appointmentsChart.updateOptions(this.appointmentsOptions);
      }
      if (this.diagnosesChart) {
        this.diagnosesChart.updateOptions(this.diagnosesOptions);
      }
      if (this.satisfactionChart) {
        this.satisfactionChart.updateOptions(this.satisfactionOptions);
      }
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
    this.updateChartData();
  }

  getChangeLabel(change: number): string {
    if (change === 0) return 'Sin cambios';
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change}% vs. anterior`;
  }
}