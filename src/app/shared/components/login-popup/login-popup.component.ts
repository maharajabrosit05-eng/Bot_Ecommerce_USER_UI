import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonService } from '../../../../service/common.service';

// Shown once per browser session, 15s after the user first lands on the
// site — but never if they're already logged in, already on /login, or
// already dismissed/logged in during this session.
const POPUP_DELAY_MS = 15000;
const SESSION_FLAG = 'login_popup_shown';

@Component({
  selector: 'app-login-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-popup.component.html',
  styleUrl: './login-popup.component.scss'
})
export class LoginPopupComponent implements OnInit, OnDestroy {

  visible = false;
  loading = false;
  errorMsg = '';

  showPassword = false;

  loginModel = {
    Mobile_No: '',
    app_password: ''
  };

  private timer?: ReturnType<typeof setTimeout>;

  constructor(private commonService: CommonService, private router: Router) {}

  ngOnInit(): void {

    const alreadyLoggedIn = !!localStorage.getItem('customer');
    const alreadyShown = sessionStorage.getItem(SESSION_FLAG);

    if (alreadyLoggedIn || alreadyShown) {
      return;
    }

    this.timer = setTimeout(() => {
      // Re-check at fire time — the user may have logged in during the wait.
      if (!localStorage.getItem('customer')) {
        this.visible = true;
        sessionStorage.setItem(SESSION_FLAG, '1');
      }
    }, POPUP_DELAY_MS);

  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  close(): void {
    this.visible = false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToFullLoginPage(): void {
    this.visible = false;
    this.router.navigateByUrl('/login');
  }

  onLogin(form: NgForm): void {

    this.errorMsg = '';

    if (form.invalid) {
      this.errorMsg = 'Please enter your mobile number and password.';
      return;
    }

    if (!/^[0-9]{10}$/.test(this.loginModel.Mobile_No)) {
      this.errorMsg = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    this.loading = true;

    this.commonService.LoginCustomer(this.loginModel).subscribe({
      next: (res: any) => {
        this.loading = false;

        if (res?.status) {
          localStorage.setItem('customer', JSON.stringify(res.data));
          this.commonService.refreshLoggedCustomer();
          this.visible = false;
          // Reload so navbar/pages relying on the stored customer pick it up.
          window.location.reload();
        } else {
          this.errorMsg = res?.message || 'Invalid mobile number or password.';
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Something went wrong. Please try again.';
      }
    });

  }

}