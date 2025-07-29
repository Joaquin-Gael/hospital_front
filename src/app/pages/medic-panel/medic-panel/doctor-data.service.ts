import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Doctor, MedicalSchedule } from '../../../services/interfaces/doctor.interfaces';
import { LoggerService } from '../../../services/core/logger.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorDataService {
  private doctorSubject = new BehaviorSubject<Doctor | null>(null);
  private schedulesSubject = new BehaviorSubject<MedicalSchedule[]>([]);

  private readonly logger = inject(LoggerService);

  setDoctor(doctor: Doctor | null): void {
    this.doctorSubject.next(doctor);
    this.logger.info('Doctor data set in service', { doctorId: doctor?.id });
  }

  setSchedules(schedules: MedicalSchedule[]): void {
    this.schedulesSubject.next(schedules);
    this.logger.info('Schedules data set in service', { schedulesCount: schedules.length });
  }

  getDoctor(): Observable<Doctor | null> {
    return this.doctorSubject.asObservable();
  }

  getSchedules(): Observable<MedicalSchedule[]> {
    return this.schedulesSubject.asObservable();
  }
}