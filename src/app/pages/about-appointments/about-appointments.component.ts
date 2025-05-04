import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

interface AppointmentInfo {
  id: number;
  title: string;
  content: string[];
  isHighlighted?: boolean;
}

interface ContactMethod {
  id: number;
  type: 'phone' | 'email' | 'location' | 'online';
  value: string;
  description: string;
  link?: string;
}

@Component({
  selector: 'app-appointment-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-appointments.component.html',
  styleUrls: ['./about-appointments.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AboutAppointmentsComponent {
  appointmentInfoItems: AppointmentInfo[] = [
    {
      id: 1,
      title: 'Ubicación y Contacto',
      content: [
        'Para solicitar turnos, dirigirse a Turnero Central ubicado en Planta Baja del Hospital (Ingreso por Calle Principal).',
        'También se pueden solicitar llamando al 0800-555-4141.'
      ]
    },
    {
      id: 2,
      title: 'Documentación Necesaria',
      content: [
        'Se deberá concurrir con DNI o fotocopia, Carnet de Historia Clínica y derivación (en caso de que sea necesaria).',
        'Los puede tramitar un tercero, con la misma documentación.'
      ]
    },
    {
      id: 3,
      title: 'Horarios de Atención',
      content: [
        'Los horarios de atención son de lunes a viernes de 6:45 a 12:00 hs.',
        'Durante este horario se entregan una cantidad de números con cupo máximo diario.'
      ],
      isHighlighted: true
    },
    {
      id: 4,
      title: 'Programa de Cirugía Bariátrica',
      content: [
        'Podés solicitar los turnos y hacer consultas enviando un email a bariatrica.hospital@gmail.com.',
        'Horario de atención de 8:00 a 12:00 horas.'
      ]
    },
    {
      id: 5,
      title: 'Especialidades con Derivación',
      content: [
        'Primer turno de Nefrología, Cardiología, Nutrición y Neurología, se requiere el pedido de derivación del médico de cabecera o clínico.'
      ]
    },
    {
      id: 6,
      title: 'Pacientes del Interior',
      content: [
        'Si sos del Interior podés solicitar turnos en el siguiente mail: turnos.hospital@gmail.com'
      ]
    },
  ];

  contactMethods: ContactMethod[] = [
    {
      id: 1,
      type: 'location',
      value: 'Planta Baja del Hospital',
      description: 'Turnero Central (Ingreso por Calle Principal)'
    },
    {
      id: 2,
      type: 'phone',
      value: '0800-555-4141',
      description: 'Línea gratuita para solicitud de turnos'
    },
    {
      id: 3,
      type: 'email',
      value: 'turnos.hospital@gmail.com',
      description: 'Email general para consultas y turnos'
    },

  ];

  onlineAppointmentUrl = '/shifts';
}