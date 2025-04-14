import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { DoctorProfileComponent } from "../doctor-profile/doctor-profile.component"
import { AppointmentScheduleComponent } from "../appointment-schedule/appointment-schedule.component"
import { PatientDetailComponent } from "../patient-detail/patient-detail.component"
import { NotificationPanelComponent } from "../notification-panel/notification-panel.component"
import { TaskListComponent } from "../task-list/task-list.component"
import { ElectronicPrescriptionComponent } from "../electronic-prescription/electronic-prescription.component"
import { StudyRequestComponent } from "../study-request/study-request.component"
import { MedicalHistoryComponent } from "../medical-history/medical-history.component"
import { PanelUiComponent } from "../panel-ui/panel-ui.component"
import { PatientsComponent } from "../patients/patients.component"
import { ScheduleComponent } from "../schedule/schedule.component"
import { RecordsComponent } from "../records/records.component"
import { MessagesComponent } from "../messages/messages.component"
import { StatisticsComponent } from "../statistics/statistics.component"
import { SettingsComponent } from "../settings/settings.component"

@Component({
  selector: "app-medic-panel",
  templateUrl: "./medic-panel.component.html",
  styleUrls: ["./medic-panel.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    DoctorProfileComponent,
    AppointmentScheduleComponent,
    PatientDetailComponent,
    NotificationPanelComponent,
    TaskListComponent,
    ElectronicPrescriptionComponent,
    StudyRequestComponent,
    MedicalHistoryComponent,
    PanelUiComponent,
    PatientsComponent,
    ScheduleComponent,
    RecordsComponent,
    MessagesComponent,
    StatisticsComponent,
    SettingsComponent,
  ],
})
export class MedicPanelComponent implements OnInit {
  selectedPatientId: string | null = null
  activeSection = "panel"

  constructor() {}

  ngOnInit(): void {
    // Initialize panel data
  }

  onSectionChange(sectionId: string): void {
    this.activeSection = sectionId
  }
}
