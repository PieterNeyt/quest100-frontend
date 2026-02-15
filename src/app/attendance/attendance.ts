import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {AttendanceService} from '../services/attendanceService';
import {TranslationService} from '../services/translationService';
import {ToastService} from '../services/toastService';

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
  private toastService = inject(ToastService);
  public t = inject(TranslationService);

  isLoading = signal(true);
  isSuccess = signal(false);
  alreadyRegistered = signal(false);
  kudosEarned = signal(0);
  totalKudos = signal(0);

  ngOnInit(): void {
    const classId = this.route.snapshot.paramMap.get('classId');

    if (!classId) {
      this.toastService.error('errors.invalidQrCode');
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

        if (!res.alreadyRegistered) {
          this.toastService.success('attendance.successMessage');
        }
      },
      error: (err) => {
        console.error('Error registering attendance:', err);
        this.toastService.error('errors.generic');
        this.isLoading.set(false);
      }
    });
  }
}
