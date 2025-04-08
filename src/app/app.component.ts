import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Importar los componentes personalizados
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { LayoutComponent } from './layout/layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LayoutComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'HospitalSDLG'
}
