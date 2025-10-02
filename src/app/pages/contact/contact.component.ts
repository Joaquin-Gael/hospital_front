import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  
  constructor(private fb: FormBuilder) {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    emailjs.init("jQiONvWQLUBr29zoL");
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;

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
        console.log('SUCCESS!', response.status, response.text);
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.contactForm.reset();
      }, (error) => {
        console.log('FAILED...', error);
        this.isSubmitting = false;
        this.submitError = true;
        this.errorMessage = 'Hubo un error al enviar el mensaje. Por favor, intente nuevamente.';
      });
  }
}