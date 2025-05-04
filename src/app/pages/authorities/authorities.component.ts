import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

interface Authority {
  id: number;
  name: string;
  position: string;
  photoUrl: string;
  description: string[];
}

interface DepartmentHead {
  id: number;
  name: string;
  department: string;
}

@Component({
  selector: 'app-authorities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './authorities.component.html',
  styleUrls: ['./authorities.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AuthoritiesComponent implements OnInit {
  authorities: Authority[] = [];
  departmentHeads: DepartmentHead[] = [];

  ngOnInit(): void {
    this.loadAuthorities();
    this.loadDepartmentHeads();
  }

  private loadAuthorities(): void {
    this.authorities = [
      {
        id: 1,
        name: 'Dr. Sergio Alejandro Ñañez',
        position: 'Director',
        photoUrl: 'assets/alejandro_nanez.png',
        description: [
          'Jefe de Servicio - Unidad Coronaria - Hospital Central',
          'Jefe de Servicio - Unidad Coronaria - Sanatorio Metropolitano',
          'Docente de Post Grado - Carrera de Especialista en Cardiología - UNC',
          'Miembro del Comité Nacional de Cirugía y Recuperación Cardiovascular - 2009',
          'Director - Curso Anual de Unidad Coronaria - 2010',
          'Vice Presidente - Congreso Nacional de Cardiología - 2011',
          'Director - Curso Anual de Actualización Cardiológica para Graduados - UNC - 2012',
          'Presidente - Sociedad de Cardiología Regional - 2013',
          'Presidente - Congreso Nacional De Cardiología - 2015'
        ]
      },
      {
        id: 2,
        name: 'Dr. Satoru Corzo',
        position: 'Subdirector',
        photoUrl: 'assets/satoru_corzo.jpg',
        description: [
          'Médico especialista en Cardiología',
          'Especialista en medicina del deporte',
          'Especialista en emergencia',
          'Médico ex residente de cardiología del Hospital Central',
          'Ex Médico de la Unidad Coronaria del Hospital Central',
          'Gestor y encargado de la Sección de Actividad Física y Rehabilitación Cardiovascular',
          'Secretario del Comité de Cardiología y Ejercicio de la Federación Argentina de Cardiología'
        ]
      },
      {
        id: 3,
        name: 'Lic. Carlos Sánchez',
        position: 'Secretario Técnico',
        photoUrl: 'assets/doctor_1.jpg',
        description: [
          'Licenciado en Administración Hospitalaria',
          'Especialista en gestión de servicios de salud',
          'Coordinador de proyectos de investigación clínica',
          'Miembro del comité de ética hospitalaria'
        ]
      },
      {
        id: 4,
        name: 'Cr. Daniel Fernández',
        position: 'Subdirector de Gestión Administrativa',
        photoUrl: 'assets/doctor_2.jpg',
        description: [
          'Contador Público Nacional',
          'Especialista en administración de servicios de salud',
          'Ex director administrativo del Hospital Universitario',
          'Asesor en gestión de recursos sanitarios'
        ]
      }
    ];
  }

  private loadDepartmentHeads(): void {
    this.departmentHeads = [
      {
        id: 1,
        name: 'Dr. Sergio Alejandro Ñañez',
        department: 'Jefe de Departamento de Cirugía'
      },
      {
        id: 2,
        name: 'Dr. Satoru Corzo',
        department: 'Jefe de Departamento de Cardiología'
      },
      {
        id: 3,
        name: 'Dr. Roberto Pérez',
        department: 'Jefe de Departamento de Clínica Médica'
      }
    ];
  }
}