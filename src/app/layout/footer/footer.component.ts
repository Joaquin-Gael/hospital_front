import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'] 
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  email = '';

  socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: 'facebook' },
    { name: 'Twitter', url: 'https://x.com/hospitalsdlg', icon: 'x-twitter' },
    { name: 'Instagram', url: 'https://instagram.com/hospital_s.d.l.g/', icon: 'instagram' }
  ];

  hospitalLinks = [
    { label: 'Sobre Nosotros', route: '/sobre-nosotros' },
    { label: 'Servicios', route: '/servicios' }
  ];

  pacientesLinks = [
    { label: 'Historial', route: '/historial' },
    { label: 'Contacto', route: '/contact' }
  ];

  legalLinks = [
    { label: 'Términos y Condiciones', route: '/terminos' },
    { label: 'Política de Privacidad', route: '/privacidad' }
  ];

  subscribe() {
    console.log(`Suscripción enviada: ${this.email}`);
  }
}
