import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonService } from '../../../service/common.service';
// ^ adjust this relative path to wherever your project's CommonService actually lives
//   (same one used by checkout.component.ts / GetCustomerByCode)

@Component({
  selector: 'app-contact-us',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  templateUrl: './contact-us.component.html',

  styleUrl: './contact-us.component.scss'
})
export class ContactUsComponent implements OnInit {

  // =========================================================
  // CONTACT FORM
  // =========================================================

  form: FormGroup;

  // =========================================================
  // UI STATE
  // =========================================================

  submitting = false;

  submitted = false;

  // Message char limit (used by the counter in the template)
  messageMaxLength = 500;

  // Which contact value was just copied (drives the "Copied!" tooltip)
  copiedKey: string | null = null;

  // true once we've pushed a logged-in customer's saved details
  // into the form — drives the small "Using your saved details" hint
  detailsPrefilled = false;

  // generic error shown above the form if the submit API call fails
  submitError = '';

  // =========================================================
  // FAQ
  // =========================================================

  openFaq: number | null = null;

  faqs = [
    {
      question: 'What are your working hours?',
      answer:
        'Our working hours are Monday to Saturday, 9:00 AM to 7:00 PM. We are closed on Sundays.'
    },
    {
      question: 'Do you offer home delivery?',
      answer:
        'Yes. We provide delivery for eligible products and locations. Delivery availability may vary depending on the product and location.'
    },
    {
      question: 'How can I track my order?',
      answer:
        'You can track your order from the My Order section after logging into your BROS IT SOLUTIONS account.'
    },
    {
      question: 'Can I return or exchange a product?',
      answer:
        'Yes, eligible products can be returned according to our return and refund policy. Please contact our support team for assistance.'
    }
  ];

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private commonService: CommonService
  ) {

    this.form = this.fb.group({

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      phone: [
        '',
        [
          Validators.pattern(/^[0-9]{10}$/)
        ]
      ],

      subject: [
        '',
        [
          Validators.required
        ]
      ],

      message: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(this.messageMaxLength)
        ]
      ]

    });

  }

  // =========================================================
  // ON INIT — auto-fill from the logged-in customer,
  // same pattern as checkout.component.ts's loadSavedAddress()
  // =========================================================

  ngOnInit(): void {
    this.prefillFromLoggedInCustomer();
  }

  private prefillFromLoggedInCustomer(): void {

    const customerCode = this.getCustomerCode();

    if (!customerCode) {
      return; // guest — leave the form empty
    }

    // instant fallback from whatever the navbar/login already stored,
    // same as checkout.component.ts does before the API call returns
    const stored = this.commonService.loggedCustomer?.();

    if (stored) {
      this.form.patchValue({
        name: stored.Customer_Name || stored.Full_Name || stored.Name || '',
       email: stored.Email_Id || '',
        phone: stored.Mobile_No || ''
      });
    }

    this.commonService.GetCustomerByCode(customerCode).subscribe({

      next: (res: any) => {

        if (!res?.status || !res?.data) {
          return;
        }

        const data = Array.isArray(res.data) ? res.data[0] : res.data;

        if (!data) {
          return;
        }

        // case-insensitive lookup, same trick used in checkout.component.ts
        const get = (key: string): string => {
          const foundKey = Object.keys(data).find(
            dk => dk.toLowerCase() === key.toLowerCase()
          );
          const value = foundKey ? data[foundKey] : null;
          return value === null || value === undefined ? '' : String(value);
        };

        const name = get('Customer_Name');
        const email = get('Email_Id');
        const phone = get('Mobile_No');

        this.form.patchValue({
          name: name || this.form.value.name,
          email: email || this.form.value.email,
          phone: phone || this.form.value.phone
        });

        if (name || email || phone) {
          this.detailsPrefilled = true;
        }
      },

      error: (error: any) => {
        console.error('CONTACT US PREFILL ERROR:', error);
      }
    });
  }

  private getCustomerCode(): string {

    try {

      const raw = localStorage.getItem('customer');
      const customer = raw ? JSON.parse(raw) : null;

      return customer?.Customer_Code?.trim() || '';

    } catch {

      return '';

    }
  }

  // =========================================================
  // FORM CONTROLS
  // =========================================================

  get f() {
    return this.form.controls;
  }

  get messageLength(): number {
    return (this.form.get('message')?.value || '').length;
  }

  // =========================================================
  // FAQ TOGGLE
  // =========================================================

  toggleFaq(index: number): void {

    if (this.openFaq === index) {
      this.openFaq = null;
    } else {
      this.openFaq = index;
    }

  }

  // =========================================================
  // SUBMIT FORM -> POST api/ContactUs/Submit -> SP_M_CONTACT_ENQUIRY_INSERT
  // =========================================================

  onSubmit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.submitError = '';
    this.submitting = true;

    const payload = {
      Customer_Code: this.getCustomerCode() || null,
      Full_Name: this.form.value.name.trim(),
      Email_Id: this.form.value.email.trim(),
      Mobile_No: this.form.value.phone ? this.form.value.phone.trim() : null,
      Subject: this.form.value.subject,
      Message: this.form.value.message.trim()
    };

    this.commonService.SubmitContactEnquiry(payload).subscribe({

      next: (res: any) => {

        this.submitting = false;

        if (res?.status) {
          this.submitted = true;
          this.form.reset();
        } else {
          this.submitError = res?.message || 'Could not send your message. Please try again.';
        }
      },

      error: (error: any) => {

        console.error('CONTACT US SUBMIT ERROR:', error);

        this.submitting = false;
        this.submitError = 'Could not send your message right now. Please try again in a moment.';
      }
    });

  }

  // =========================================================
  // SEND ANOTHER MESSAGE
  // =========================================================

  sendAnother(): void {

    this.submitted = false;
    this.submitError = '';

    this.form.reset();

    this.submitting = false;

    // re-apply saved details so a logged-in customer doesn't
    // have to retype their name/email/phone again
    this.prefillFromLoggedInCustomer();

  }

  // =========================================================
  // WHATSAPP
  // =========================================================

  openWhatsApp(): void {

    window.open(
      'https://wa.me/919363617197',
      '_blank'
    );

  }

  // =========================================================
  // EMAIL
  // =========================================================

  openEmail(): void {

    window.location.href =
      'mailto:admin@brositsolutions.com';

  }

  // =========================================================
  // PHONE
  // =========================================================

  callUs(phone: string): void {

    window.location.href = `tel:${phone}`;

  }

  // =========================================================
  // COPY TO CLIPBOARD (phone / email quick-copy)
  // =========================================================

  copyValue(key: string, value: string, event: Event): void {

    event.stopPropagation();

    if (navigator?.clipboard?.writeText) {

      navigator.clipboard.writeText(value).then(() => {

        this.copiedKey = key;

        setTimeout(() => {

          if (this.copiedKey === key) {
            this.copiedKey = null;
          }

        }, 1500);

      });

    }

  }

  // =========================================================
  // GOOGLE MAPS
  // =========================================================

  openMap(): void {

    const query =
      encodeURIComponent(
        'BROS IT SOLUTIONS, Chennai, Tamil Nadu, India'
      );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      '_blank'
    );

  }

  // =========================================================
  // QUICK LINKS
  // =========================================================

  goToOrder(): void {

    this.router.navigate(['/my_order']);

  }

  goToProducts(): void {

    this.router.navigate(['/products']);

  }

  goToReturns(): void {

    this.router.navigate(['/conditions_of_us']);

  }

  goToWarranty(): void {

    this.router.navigate(['/help']);

  }

}