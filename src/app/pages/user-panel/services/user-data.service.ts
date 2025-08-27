import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { LoggerService } from '../../../services/core/logger.service';
import { AppointmentViewModel, Turn, TurnState } from '../../../services/interfaces/appointment.interfaces';
import { HealthInsuranceRead } from '../../../services/interfaces/health-insurance.interfaces';
import { UserRead } from '../../../services/interfaces/user.interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private userSubject = new BehaviorSubject<UserRead | null>(null);
  private appointmentsSubject = new BehaviorSubject<Turn[]>([]);
  private healthinsuranceSubject = new BehaviorSubject<HealthInsuranceRead[]>([]);

  private readonly logger = inject(LoggerService);

  setDoctor(doctor: UserRead | null): void {
    this.userSubject.next(doctor);
    this.logger.info('Doctor data set in service', { doctorId: doctor?.id });
  }

  setAppointments(appointments: Turn[]): void {
    this.appointmentsSubject.next(appointments);
  }

  setHealthInsurances(his: HealthInsuranceRead[]): void {
    this.healthinsuranceSubject.next(his);
  }

  getUser(): Observable<UserRead | null> {
    return this.userSubject.asObservable();
  }

  getAppointments(): Observable<Turn[]> {
    return this.appointmentsSubject.asObservable();
  }

  getInsuranceName(hiId: string): Observable<string> {
    return this.healthinsuranceSubject.pipe(
      map((his) => {
        const hi = his.find(s => s.id === hiId);
        return hi ? hi.name : 'Sin obra social';
      })
    );
  }
}