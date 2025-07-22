import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-service-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="platform-section">
      <div class="section-header">
        <h2>Servicios Destacados</h2>
        <p class="section-description">Conoce nuestros servicios especializados diseñados para cubrir todas tus necesidades de salud</p>
      </div>

      <div class="platform-tabs">
        <div class="tab-headers">
          <button 
            class="tab-header" 
            [class.active]="activeTab === 'emergencies'"
            (click)="setActiveTab('emergencies')">
            <span class="material-icons">emergency</span>
            Emergencias
          </button>
          <button 
            class="tab-header" 
            [class.active]="activeTab === 'checkups'"
            (click)="setActiveTab('checkups')">
            <span class="material-icons">health_and_safety</span>
            Chequeos Preventivos
          </button>
          <button 
            class="tab-header" 
            [class.active]="activeTab === 'surgery'"
            (click)="setActiveTab('surgery')">
            <span class="material-icons">medical_services</span>
            Cirugía
          </button>
        </div>
        
        <div class="tab-content">
          <div class="tab-pane" *ngIf="activeTab === 'emergencies'">
            <div class="tab-image">
              <div class="image-placeholder hospital-image"></div>
            </div>
            <div class="tab-info">
              <h3>Servicio de Emergencias</h3>
              <p>Nuestro servicio de emergencias está disponible las 24 horas del día, los 365 días del año. Contamos con médicos especialistas, equipamiento de última generación y protocolos de atención rápida para garantizar la mejor atención en momentos críticos.</p>
              <ul class="feature-list">
                <li><span class="material-icons">check_circle</span> Atención inmediata 24/7</li>
                <li><span class="material-icons">check_circle</span> Equipo médico especializado</li>
                <li><span class="material-icons">check_circle</span> Unidad de trauma y shock</li>
                <li><span class="material-icons">check_circle</span> Diagnóstico por imágenes inmediato</li>
                <li><span class="material-icons">check_circle</span> Unidad de cuidados intensivos</li>
              </ul>
            </div>
          </div>
          
          <div class="tab-pane" *ngIf="activeTab === 'checkups'">
            <div class="tab-image">
              <div class="image-placeholder clinic-image"></div>
            </div>
            <div class="tab-info">
              <h3>Chequeos Médicos Preventivos</h3>
              <p>Programas de chequeo médico diseñados para detectar factores de riesgo y enfermedades en etapas tempranas. Nuestros paquetes están personalizados según edad, género y antecedentes médicos para una evaluación integral de su salud.</p>
              <ul class="feature-list">
                <li><span class="material-icons">check_circle</span> Evaluación médica completa</li>
                <li><span class="material-icons">check_circle</span> Análisis de laboratorio</li>
                <li><span class="material-icons">check_circle</span> Estudios de imagen</li>
                <li><span class="material-icons">check_circle</span> Evaluación cardiológica</li>
                <li><span class="material-icons">check_circle</span> Informe médico detallado</li>
              </ul>
            </div>
          </div>
          
          <div class="tab-pane" *ngIf="activeTab === 'surgery'">
            <div class="tab-image">
              <div class="image-placeholder doctor-image"></div>
            </div>
            <div class="tab-info">
              <h3>Centro Quirúrgico</h3>
              <p>Nuestro centro quirúrgico cuenta con quirófanos equipados con tecnología de vanguardia y un equipo de cirujanos altamente especializados. Realizamos procedimientos de mínima invasión hasta cirugías de alta complejidad con los más altos estándares de seguridad.</p>
              <ul class="feature-list">
                <li><span class="material-icons">check_circle</span> Quirófanos de última generación</li>
                <li><span class="material-icons">check_circle</span> Cirugía mínimamente invasiva</li>
                <li><span class="material-icons">check_circle</span> Cirugía robótica</li>
                <li><span class="material-icons">check_circle</span> Recuperación postoperatoria especializada</li>
                <li><span class="material-icons">check_circle</span> Seguimiento personalizado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./service-tabs.component.scss']
})
export class ServiceTabsComponent {
  activeTab = 'emergencies';

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}