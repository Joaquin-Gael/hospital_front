import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Doctor, MedicalSchedule } from '../../../services/interfaces/doctor.interfaces';
import { Specialty } from '../../../services/interfaces/hospital.interfaces'
import { LoggerService } from '../../../services/core/logger.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorDataService {
  private doctorSubject = new BehaviorSubject<Doctor | null>(null);
  private schedulesSubject = new BehaviorSubject<MedicalSchedule[]>([]);
  private specialitiesSubject = new BehaviorSubject<Specialty[]>([]);

  private readonly logger = inject(LoggerService);

  setDoctor(doctor: Doctor | null): void {
    this.doctorSubject.next(doctor);
    this.logger.info('Doctor data set in service', { doctorId: doctor?.id });
  }

  setSchedules(schedules: MedicalSchedule[]): void {
    this.schedulesSubject.next(schedules);
    this.logger.info('Schedules data set in service', { schedulesCount: schedules.length });
  }

  setSpecialities(specialities: Specialty[]): void {
    this.specialitiesSubject.next(specialities);
    this.logger.info('Specialities data set in service', { specialitiesCount: specialities.length });
  }

  getDoctor(): Observable<Doctor | null> {
    return this.doctorSubject.asObservable();
  }

  getSchedules(): Observable<MedicalSchedule[]> {
    return this.schedulesSubject.asObservable();
  }

  getSpecialities(): Observable<Specialty[]> {
    return this.specialitiesSubject.asObservable();
  }

  getSpecialityName(specialityId: string): Observable<string> {
    return this.specialitiesSubject.pipe(
      map((specialities) => {
        const speciality = specialities.find(s => s.id === specialityId);
        return speciality ? speciality.name : 'N/A';
      })
    );
  }
}