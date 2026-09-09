import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

import { CommonService } from '../../../service/common.service';


// =====================================================
// PROFILE MODEL
// (mirrors M_CUSTOMER_MASTER — excluding internal/system
// columns: U_Id, app_password, Is_Active, Created_By/On,
// Updated_By/On, Company_Code, Branch_Code)
// =====================================================

interface ProfileModel {
  Customer_Code: string;
  Customer_Name: string;
  Mobile_No: string;
  Email_Id: string;

  GSTIN_Number: string;

  Billing_Address: string;
  Billing_City: string;
  Billing_State: string;
  Billing_Zipcode: string;

  Shipping_Address: string;
  Shipping_City: string;
  Shipping_State: string;
  Shipping_Zipcode: string;
}


@Component({
  selector: 'app-profile',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './profile.component.html',

  styleUrl: './profile.component.css'
})


export class ProfileComponent implements OnInit {


  // =====================================================
  // UI STATES
  // =====================================================

  loading = true;

  saving = false;

  editMode = false;

  errorMessage = '';


  // =====================================================
  // ⭐ MOBILE / TABLET SECTION REVEAL
  // On mobile & tablet, Personal Information / Billing
  // Address / Shipping Address are hidden by default and
  // only appear once their matching Quick Action card is
  // tapped (see scrollToSection below). On desktop these
  // are always visible — see the CSS media query.
  // =====================================================

  visibleSections = new Set<string>();


  // =====================================================
  // ⭐ HAS GST toggle — shows/hides the GSTIN field
  // =====================================================

  hasGst = false;


  // =====================================================
  // ⭐ SAME AS BILLING — mirrors billing into shipping
  // =====================================================

  sameAsBilling = true;


  // =====================================================
  // PROFILE DATA
  // =====================================================

  profile: ProfileModel = {
    Customer_Code: '',
    Customer_Name: '',
    Mobile_No: '',
    Email_Id: '',

    GSTIN_Number: '',

    Billing_Address: '',
    Billing_City: '',
    Billing_State: '',
    Billing_Zipcode: '',

    Shipping_Address: '',
    Shipping_City: '',
    Shipping_State: '',
    Shipping_Zipcode: ''
  };

  // snapshot kept so "Cancel" can discard unsaved edits
  private profileSnapshot: ProfileModel = { ...this.profile };

  private snapshotHasGst = false;

  private snapshotSameAsBilling = true;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private commonService: CommonService,
    public router: Router
  ) { }


  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit(): void {
    this.loadProfile();
  }


  // =====================================================
  // AVATAR INITIALS (shown in the circle at the top)
  // =====================================================

  get initials(): string {
    const name = (this.profile.Customer_Name || '').trim();

    if (!name) {
      return 'U';
    }

    const parts = name.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }


  // =====================================================
  // LOAD PROFILE
  // =====================================================

  loadProfile(): void {

    const stored = this.commonService.loggedCustomer();

    if (!stored?.Customer_Code) {
      this.loading = false;
      this.errorMessage = 'Please login to view your profile.';
      return;
    }

    this.applyCustomer(stored);

    this.commonService.GetCustomerByCode(stored.Customer_Code).subscribe({

      next: (res: any) => {

        this.loading = false;

        if (res?.status && res?.data) {
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          if (data) {
            this.applyCustomer(data);
          }
        }
      },

      error: (error: any) => {
        console.error('GET CUSTOMER ERROR:', error);
        this.loading = false;
        // keep showing the locally-stored details even if the refresh fails
      }
    });
  }


  private applyCustomer(data: any): void {

    this.profile = {

      Customer_Code: data.Customer_Code || this.profile.Customer_Code || '',
      Customer_Name: data.Customer_Name || data.Full_Name || data.Name || '',
      Mobile_No: data.Mobile_No || '',
      Email_Id: data.Email_Id || '',

      GSTIN_Number: data.GSTIN_Number || '',

      Billing_Address: data.Billing_Address || '',
      Billing_City: data.Billing_City || '',
      Billing_State: data.Billing_State || '',
      Billing_Zipcode: data.Billing_Zipcode || '',

      Shipping_Address: data.Shipping_Address || '',
      Shipping_City: data.Shipping_City || '',
      Shipping_State: data.Shipping_State || '',
      Shipping_Zipcode: data.Shipping_Zipcode || ''

    };


    this.hasGst = !!this.profile.GSTIN_Number;


    // ⭐ Detect whether shipping already matches billing, so the
    // "Same as Billing" checkbox reflects the real saved state.
    this.sameAsBilling =
      this.profile.Shipping_Address === this.profile.Billing_Address &&
      this.profile.Shipping_City === this.profile.Billing_City &&
      this.profile.Shipping_State === this.profile.Billing_State &&
      this.profile.Shipping_Zipcode === this.profile.Billing_Zipcode;


    this.profileSnapshot = { ...this.profile };

    this.snapshotHasGst = this.hasGst;

    this.snapshotSameAsBilling = this.sameAsBilling;

  }


  // =====================================================
  // ⭐ SCROLL TO SECTION — used by the "View Address" and
  //    "Personal Information" quick action buttons so the
  //    matching card on this same page is brought into view.
  // =====================================================

  scrollToSection(elementId: string): void {

    // Reveal this section (and, for "addressCard", the Shipping
    // Address card right after it too — on mobile/tablet both are
    // hidden by default and the single "View Address" quick action
    // covers both of them). No-op on desktop, where the CSS media
    // query keeps every section visible already.
    this.visibleSections.add(elementId);

    if (elementId === 'addressCard') {
      this.visibleSections.add('shippingAddressCard');
    }

    // Wait a tick so Angular has actually rendered the now-revealed
    // section before we try to scroll to it.
    setTimeout(() => {

      const el = document.getElementById(elementId);

      if (!el) {
        return;
      }

      el.scrollIntoView({ behavior: 'smooth', block: 'start' });

      el.classList.add('section-highlight');

      setTimeout(() => {
        el.classList.remove('section-highlight');
      }, 1500);

    });

  }


  // =====================================================
  // EDIT / CANCEL
  // =====================================================

  startEdit(): void {

    this.profileSnapshot = { ...this.profile };

    this.snapshotHasGst = this.hasGst;

    this.snapshotSameAsBilling = this.sameAsBilling;

    this.editMode = true;

  }


  cancelEdit(form?: NgForm): void {

    this.profile = { ...this.profileSnapshot };

    this.hasGst = this.snapshotHasGst;

    this.sameAsBilling = this.snapshotSameAsBilling;

    this.editMode = false;

    form?.resetForm(this.profile);

  }


  // =====================================================
  // ⭐ SAME-AS-BILLING SYNC
  // =====================================================

  onSameAsBillingChange(): void {

    if (this.sameAsBilling) {

      this.syncShippingFromBilling();

    }

  }


  // Call this on every billing field change too, so shipping stays
  // mirrored live while "Same as Billing" is checked.
  syncShippingFromBilling(): void {

    if (!this.sameAsBilling) {

      return;

    }

    this.profile.Shipping_Address = this.profile.Billing_Address;
    this.profile.Shipping_City = this.profile.Billing_City;
    this.profile.Shipping_State = this.profile.Billing_State;
    this.profile.Shipping_Zipcode = this.profile.Billing_Zipcode;

  }


  // =====================================================
  // ⭐ GST TOGGLE
  // =====================================================

  onHasGstChange(): void {

    if (!this.hasGst) {

      this.profile.GSTIN_Number = '';

    }

  }


  // =====================================================
  // SAVE
  // =====================================================

  saveProfile(form: NgForm): void {

    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    if (this.sameAsBilling) {

      this.syncShippingFromBilling();

    }

    this.saving = true;


    const namePayload = {
      Customer_Code: this.profile.Customer_Code,
      Customer_Name: this.profile.Customer_Name,
      Email_Id: this.profile.Email_Id
    };


    const addressPayload = {
      Customer_Code: this.profile.Customer_Code,
      Customer_Name: this.profile.Customer_Name,
      Mobile_No: this.profile.Mobile_No,

      Billing_Address: this.profile.Billing_Address,
      Billing_City: this.profile.Billing_City,
      Billing_State: this.profile.Billing_State,
      Billing_Zipcode: this.profile.Billing_Zipcode,

      Shipping_Address: this.profile.Shipping_Address,
      Shipping_City: this.profile.Shipping_City,
      Shipping_State: this.profile.Shipping_State,
      Shipping_Zipcode: this.profile.Shipping_Zipcode,

      GSTIN_Number: this.hasGst ? this.profile.GSTIN_Number : '',

      Updated_By: this.profile.Customer_Code
    };


    forkJoin([
      this.commonService.UpdateCustomer(namePayload),
      this.commonService.SaveCustomerAddress(addressPayload)
    ]).subscribe({

      next: ([nameRes, addressRes]: [any, any]) => {

        this.saving = false;

        if (nameRes?.status && addressRes?.status) {

          if (!this.hasGst) {

            this.profile.GSTIN_Number = '';

          }

          // keep navbar / rest of app in sync with the new details
          localStorage.setItem(
            'customer',
            JSON.stringify({ ...this.commonService.loggedCustomer(), ...this.profile })
          );
          this.commonService.refreshLoggedCustomer();

          this.profileSnapshot = { ...this.profile };
          this.snapshotHasGst = this.hasGst;
          this.snapshotSameAsBilling = this.sameAsBilling;
          this.editMode = false;

          Swal.fire({
            icon: 'success',
            title: 'Profile Updated!',
            text: 'Your details have been saved.',
            showConfirmButton: false,
            timer: 1600,
            timerProgressBar: true
          });

        } else {

          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: nameRes?.message || addressRes?.message || 'Please try again.'
          });
        }
      },

      error: (error: any) => {
        console.error('UPDATE PROFILE ERROR:', error);
        this.saving = false;

        Swal.fire({
          icon: 'error',
          title: 'Something went wrong',
          text: 'Could not update your profile. Please try again.'
        });
      }
    });
  }


  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    Swal.fire({
      icon: 'warning',
      title: 'Logout?',
      text: 'Are you sure you want to logout of your account.',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e63946'
    }).then(result => {

      if (result.isConfirmed) {
        this.commonService.logout();
        this.router.navigateByUrl('/');
      }
    });
  }
}