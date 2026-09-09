import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-privacy-notice',
  standalone: true,
  imports: [],
  templateUrl: './privacy-notice.component.html',
  styleUrl: './privacy-notice.component.css'
})
export class PrivacyNoticeComponent {

currentYear = new Date().getFullYear();

  constructor(public router: Router) {}

  goToConditions(): void {
    this.router.navigateByUrl('/conditions_of_us');
  }

  goToHome(): void {
    this.router.navigateByUrl('/');
  }

  scrollToSection(id: string): void {
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
