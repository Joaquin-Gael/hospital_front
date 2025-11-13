import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TurnRescheduleRequest } from '../../../services/interfaces/appointment.interfaces';

interface RescheduleTurnDialogData {
  currentDate?: string;
  currentTime?: string;
}

@Component({
  selector: 'app-reschedule-turn-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="reschedule-form">
      <h2 mat-dialog-title>Reprogramar turno</h2>
      <mat-dialog-content>
        <div class="form-field">
          <label for="reschedule-date">Nueva fecha</label>
          <input
            id="reschedule-date"
            type="date"
            formControlName="date"
            required
          />
        </div>
        <div class="form-field">
          <label for="reschedule-time">Nuevo horario</label>
          <input
            id="reschedule-time"
            type="time"
            formControlName="time"
            required
          />
        </div>
        <div class="form-field">
          <label for="reschedule-reason">Motivo (opcional)</label>
          <textarea
            id="reschedule-reason"
            rows="3"
            formControlName="reason"
            placeholder="Escribe un motivo (opcional)"
          ></textarea>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-button color="primary" type="submit" [disabled]="form.invalid">
          Reprogramar
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .reschedule-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-field input,
      .form-field textarea {
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.95rem;
      }

      .form-field textarea {
        resize: vertical;
        min-height: 3rem;
      }
    `,
  ],
})
export class RescheduleTurnDialogComponent {
  readonly form = this.fb.group({
    date: [this.data?.currentDate ?? '', Validators.required],
    time: [this.data?.currentTime ?? '', Validators.required],
    reason: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<RescheduleTurnDialogComponent, TurnRescheduleRequest | undefined>,
    @Inject(MAT_DIALOG_DATA) public readonly data: RescheduleTurnDialogData
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { date, time, reason } = this.form.value;
    const sanitizedReason = typeof reason === 'string' && reason.trim().length > 0 ? reason.trim() : undefined;

    const payload: TurnRescheduleRequest = {
      date: (date as string) ?? '',
      time: this.ensureSeconds(time as string),
      ...(sanitizedReason ? { reason: sanitizedReason } : {}),
    };

    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  private ensureSeconds(time: string): string {
    if (!time) {
      return time;
    }

    return time.length === 5 ? `${time}:00` : time;
  }
}
