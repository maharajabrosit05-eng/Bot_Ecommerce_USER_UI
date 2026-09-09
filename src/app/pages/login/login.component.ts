import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from '../../../service/common.service';
import Swal from 'sweetalert2';

interface SignupModel {
  Customer_Name: string;
  Mobile_No: string;
  Email_Id: string;
  app_password: string;
  confirmPassword: string;
}


interface LoginModel {
  Mobile_No: string;
  app_password: string;
}


@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './login.component.html',

  styleUrl: './login.component.css'
})


export class LoginComponent {


  // =====================================================
  // MODE
  // =====================================================

  mode: 'login' | 'signup' = 'login';


  // =====================================================
  // UI STATES
  // =====================================================

  loading = false;

  errorMsg = '';

  successMsg = '';


  // =====================================================
  // CURRENT YEAR
  // =====================================================

  currentYear = new Date().getFullYear();


  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  showLoginPassword = false;

  showSignupPassword = false;

  showConfirmPassword = false;


  // =====================================================
  // REMEMBER ME
  // =====================================================

  rememberMe = false;


  // =====================================================
  // RETURN URL (where to go back after successful login —
  // e.g. a product page that sent the user here to write a review)
  // =====================================================

  private returnUrl: string | null = null;


  // =====================================================
  // LOGIN MODEL
  // =====================================================

  loginModel: LoginModel = {

    Mobile_No: '',

    app_password: ''

  };


  // =====================================================
  // SIGNUP MODEL
  // =====================================================

  signupModel: SignupModel = {

    Customer_Name: '',

    Mobile_No: '',

    Email_Id: '',

    app_password: '',

    confirmPassword: ''

  };


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(

    private commonService: CommonService,

    private route: ActivatedRoute,

    public router: Router

  ) {

    this.loadRememberedMobile();

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

  }


  // =====================================================
  // SWITCH LOGIN / SIGNUP
  // =====================================================

  switchMode(
    mode: 'login' | 'signup'
  ): void {

    this.mode = mode;

    this.errorMsg = '';

    this.successMsg = '';

    this.loading = false;

  }


  // =====================================================
  // LOGIN
  // =====================================================

  onLogin(form: NgForm): void {

    this.errorMsg = '';

    this.successMsg = '';


    // Form validation
    if (form.invalid) {

      this.errorMsg =
        'Please enter your mobile number and password.';

      return;

    }


    // Mobile validation
    if (
      !/^[0-9]{10}$/.test(
        this.loginModel.Mobile_No
      )
    ) {

      this.errorMsg =
        'Please enter a valid 10-digit mobile number.';

      return;

    }


    this.loading = true;


    // ===================================================
    // API CALL
    // ===================================================

    this.commonService
      .LoginCustomer(this.loginModel)
      .subscribe({

        next: (res: any) => {

          this.loading = false;


          if (res?.status) {


            localStorage.setItem(
              'customer',
              JSON.stringify(res.data)
            );

            this.commonService.refreshLoggedCustomer();


            if (this.rememberMe) {

              localStorage.setItem(
                'remembered_mobile',
                this.loginModel.Mobile_No
              );

            } else {

              localStorage.removeItem(
                'remembered_mobile'
              );

            }


            Swal.fire({
              icon: 'success',
              title: 'Login Successful!',
              text: 'Welcome back!',
              showConfirmButton: false,
              timer: 1600,
              timerProgressBar: true,
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {


              if (this.returnUrl) {
                this.router.navigateByUrl(this.returnUrl);
              } else {
                this.router.navigateByUrl('/');
              }

            });

          }

          else {

            this.errorMsg =
              res?.message ||
              'Invalid mobile number or password.';

          }

        },


        error: (error) => {

          console.error(
            'Login error:',
            error
          );


          this.loading = false;


          this.errorMsg =
            'Something went wrong. Please try again.';

        }

      });

  }


  // =====================================================
  // SIGNUP
  // =====================================================

  onSignup(form: NgForm): void {

    this.errorMsg = '';

    this.successMsg = '';


    // Form validation
    if (form.invalid) {

      this.errorMsg =
        'Please fill in all required fields.';

      return;

    }


    // Mobile validation
    if (
      !/^[0-9]{10}$/.test(
        this.signupModel.Mobile_No
      )
    ) {

      this.errorMsg =
        'Please enter a valid 10-digit mobile number.';

      return;

    }


    // Password validation
    if (
      this.signupModel.app_password !==
      this.signupModel.confirmPassword
    ) {

      this.errorMsg =
        'Passwords do not match.';

      return;

    }


    // Minimum password
    if (
      this.signupModel.app_password.length < 4
    ) {

      this.errorMsg =
        'Password must contain at least 4 characters.';

      return;

    }


    this.loading = true;


    // ===================================================
    // PAYLOAD
    // ===================================================

    const payload = {

      Customer_Name:
        this.signupModel.Customer_Name.trim(),

      Mobile_No:
        this.signupModel.Mobile_No.trim(),

      Email_Id:
        this.signupModel.Email_Id.trim(),

      app_password:
        this.signupModel.app_password,

      Created_By:
        'WEB'

    };


    // ===================================================
    // API
    // =====================================================

    this.commonService
      .SaveCustomer(payload)
      .subscribe({

        next: (res: any) => {

          this.loading = false;


          if (res?.status) {

            const mobile =
              this.signupModel.Mobile_No;

           
            this.signupModel = {
              Customer_Name: '',
              Mobile_No: '',
              Email_Id: '',
              app_password: '',
              confirmPassword: ''
            };

         
            form.resetForm();

         
            this.mode = 'login';

            
            this.loginModel.Mobile_No = mobile;

            this.loginModel.app_password = '';

           
            Swal.fire({
              icon: 'success',
              title: 'Account Created!',
              text: 'Your account has been created successfully. Please log in.',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              allowOutsideClick: false
            });

          }

          else {

            this.errorMsg =
              res?.message ||
              'Could not create your account.';

          }

        },


        error: (error) => {

          console.error(
            'Signup error:',
            error
          );


          this.loading = false;


          this.errorMsg =
            'Something went wrong. Please try again.';

        }

      });

  }


  // =====================================================
  // LOGIN PASSWORD TOGGLE
  // =====================================================

  toggleLoginPassword(): void {

    this.showLoginPassword =
      !this.showLoginPassword;

  }


  // =====================================================
  // SIGNUP PASSWORD TOGGLE
  // =====================================================

  toggleSignupPassword(): void {

    this.showSignupPassword =
      !this.showSignupPassword;

  }


  // =====================================================
  // CONFIRM PASSWORD TOGGLE
  // =====================================================

  toggleConfirmPassword(): void {

    this.showConfirmPassword =
      !this.showConfirmPassword;

  }


  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  forgotPassword(): void {

    this.errorMsg = '';

    this.successMsg =
      'Password reset option will be available soon.';

  }


  // =====================================================
  // CLEAR MESSAGE
  // =====================================================

  clearMessages(): void {

    this.errorMsg = '';

    this.successMsg = '';

  }


  // =====================================================
  // LOAD REMEMBERED MOBILE
  // =====================================================

  private loadRememberedMobile(): void {

    const mobile =
      localStorage.getItem(
        'remembered_mobile'
      );


    if (mobile) {

      this.loginModel.Mobile_No =
        mobile;

      this.rememberMe = true;

    }

  }

}