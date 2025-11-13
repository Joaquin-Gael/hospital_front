import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { HeroComponent, HeroData } from '../../shared/hero/hero.component';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  // Form properties
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';

  // Hero data para contacto
  heroData: HeroData = {
    backgroundImage: 'assets/hero-two.png',
    altText: 'Contacto Hospital SDLG',
    title: 'Contáctenos',
    subtitle: 'Estamos aquí para ayudarle  ',
    highlightText: ' 24/7'
  };

  constructor(private fb: FormBuilder) {
    // Inicializar formulario con validaciones
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}')]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    // Inicializar EmailJS
    emailjs.init("jQiONvWQLUBr29zoL");
  }

  onSubmit(): void {
    // Validar formulario
    if (this.contactForm.invalid) {
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Iniciar envío
    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;

    // Preparar parámetros del email
    const templateParams = {
      to_email: 'hospitalsdlg@gmail.com',
      from_name: this.contactForm.value.name,
      from_email: this.contactForm.value.email,
      from_phone: this.contactForm.value.phone,
      subject: this.contactForm.value.subject,
      message: this.contactForm.value.message
    };

    emailjs.send('service_qzsm4us', 'template_l9000wu', templateParams)
      .then((response) => {
        console.log('Email enviado exitosamente:', response.status, response.text);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
        
        setTimeout(() => {
          this.submitSuccess = false;
        }, 5000);
      })
      .catch((error) => {
        console.error('Error al enviar email:', error);
        this.isSubmitting = false;
        this.submitError = true;
        this.errorMessage = 'Hubo un error al enviar el mensaje. Por favor, intente nuevamente.';
      
        setTimeout(() => {
          this.submitError = false;
        }, 5000);
      });
  }
}