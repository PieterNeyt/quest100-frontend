import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AttendanceService} from '../services/attendanceService';
import {TranslationService} from '../services/translationService';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css'
})
export class AttendanceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private attendanceService = inject(AttendanceService);
  public t = inject(TranslationService);
  isLoading = signal(true);
  isSuccess = signal(false);
  alreadyRegistered = signal(false);
  errorMessage = signal<string | null>(null);
  kudosEarned = signal(0);
  totalKudos = signal(0);

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');

    if (!classId) {
      this.errorMessage.set('Ongeldige QR-code');
      this.isLoading.set(false);
      return;
    }

    this.attendanceService.registerAttendance(classId).subscribe({
      next: (res) => {
        this.isSuccess.set(true);
        this.isLoading.set(false);
        this.totalKudos.set(res.totalKudos);
        this.kudosEarned.set(res.kudosEarned);
        this.alreadyRegistered.set(res.alreadyRegistered);
      },
      error: (err) => {
        console.error('Error registering attendance:', err);
        this.errorMessage.set(
          err.error?.error || 'Er is een fout opgetreden bij het registreren van aanwezigheid'
        );
        this.isLoading.set(false);
      }
    });
  }
}
