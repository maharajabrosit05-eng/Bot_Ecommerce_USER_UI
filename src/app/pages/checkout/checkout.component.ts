import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CommonService } from '../../../service/common.service';
import { OrderService } from '../../core/services/order.service';

declare const window: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {

  /* =====================================================
     CHECKOUT STEP
     1 = ADDRESS
     2 = PAYMENT
  ====================================================== */

  checkoutStep: 1 | 2 = 1;


  /* =====================================================
     ADDRESS
  ====================================================== */

  fullName = '';
  phone = '';
  addressLine = '';
  city = '';
  state = '';
  pincode = '';
  landmark = '';
  alternate_phone = '';

  /* =====================================================
     SAVED ADDRESS (pre-fill from M_CUSTOMER_MASTER)
     - loadingAddress: show a small "loading saved address"
       hint while GetCustomerByCode is in flight.
     - addressPrefilled: true once we've pushed the saved
       Billing_* columns into the form, so the "Saved
       address used" chip only shows when it's real.
  ====================================================== */

  loadingAddress = false;
  addressPrefilled = false;


  /* =====================================================
     GSTIN (OPTIONAL — for business/GST invoice)
     Standard 15-char GSTIN format:
     2 digits state code, 10-char PAN, 1 entity code, 'Z', 1 checksum.
  ====================================================== */

  needsGstInvoice = false;
  gstin = '';

  get isGstinValid(): boolean {
    if (!this.needsGstInvoice) {
      return true;
    }

    const v = this.gstin.trim().toUpperCase();

    if (!v) {
      return false; // toggled on but left empty -> block continue
    }

    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
  }

  onGstToggleChange(): void {
    if (!this.needsGstInvoice) {
      this.gstin = '';
    }
  }


  /* =====================================================
     INDIAN STATES (fixed list, all states + union territories)
  ====================================================== */

  readonly indianStates: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];


  /* =====================================================
     CITIES BY STATE
     Curated list of major cities. The city field itself is a
     free-text input with these as suggestions (datalist), so
     the person can still type any city/town not in this list —
     and pincode lookup / GPS location auto-add whatever city
     they resolve to, into this list, on the fly.
  ====================================================== */

  citiesByState: Record<string, string[]> = {
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Davanagere', 'Ballari', 'Tumakuru'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kolhapur'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Kollam', 'Thrissur'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
    'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
    'Puducherry': ['Puducherry', 'Karaikal'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu'],
    'Chandigarh': ['Chandigarh'],
    'Tripura': ['Agartala'],
    'Manipur': ['Imphal'],
    'Meghalaya': ['Shillong'],
    'Mizoram': ['Aizawl'],
    'Nagaland': ['Kohima', 'Dimapur'],
    'Sikkim': ['Gangtok'],
    'Arunachal Pradesh': ['Itanagar'],
    'Ladakh': ['Leh', 'Kargil'],
    'Andaman and Nicobar Islands': ['Port Blair'],
    'Lakshadweep': ['Kavaratti'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Silvassa']
  };

  get availableCities(): string[] {
    return this.state ? (this.citiesByState[this.state] || []) : [];
  }

  onStateChange(): void {
    // Clear city if it no longer matches the newly chosen state's list,
    // so people don't accidentally submit a mismatched city/state pair.
    if (this.city && !this.availableCities.includes(this.city)) {
      this.city = '';
    }
  }

  private ensureCityInList(state: string, city: string): void {
    if (!state || !city) return;
    if (!this.citiesByState[state]) {
      this.citiesByState[state] = [];
    }
    if (!this.citiesByState[state].includes(city)) {
      this.citiesByState[state] = [city, ...this.citiesByState[state]];
    }
  }


  /* =====================================================
     PINCODE -> AUTO CITY / STATE LOOKUP
     Uses India Post's free public pincode API.
  ====================================================== */

  pincodeLookupLoading = false;
  pincodeLookupError = '';

  onPincodeInput(): void {
    this.pincodeLookupError = '';

    const pin = this.pincode.trim();

    if (/^\d{6}$/.test(pin)) {
      this.lookupPincode(pin);
    }
  }

  private async lookupPincode(pin: string): Promise<void> {

    this.pincodeLookupLoading = true;

    try {

      const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await response.json();

      const record = Array.isArray(data) ? data[0] : null;
      const postOffice = record?.PostOffice?.[0];

      if (record?.Status === 'Success' && postOffice) {

        const resolvedState = postOffice.State;
        const resolvedCity = postOffice.District || postOffice.Block || postOffice.Name;

        if (resolvedState) {
          this.state = resolvedState;
        }

        if (resolvedCity) {
          this.ensureCityInList(resolvedState, resolvedCity);
          this.city = resolvedCity;
        }

      } else {

        this.pincodeLookupError =
          'Could not auto-detect city/state for this pincode. Please select manually.';
      }

    } catch {

      this.pincodeLookupError =
        'Unable to verify pincode right now. Please select city/state manually.';

    } finally {

      this.pincodeLookupLoading = false;

    }
  }


  /* =====================================================
     "USE MY CURRENT LOCATION"
     Browser GPS + free OpenStreetMap reverse-geocoding —
     no API key needed.
  ====================================================== */

  locatingUser = false;
  locationError = '';

  useCurrentLocation(): void {

    if (!navigator.geolocation) {
      this.locationError = 'Location is not supported on this browser.';
      return;
    }

    this.locationError = '';
    this.locatingUser = true;

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        const { latitude, longitude } = position.coords;

        try {

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );

          const data = await response.json();
          const addr = data?.address || {};

          const houseNumber = addr.house_number || '';
          const road = addr.road || addr.neighbourhood || addr.suburb || '';
          const resolvedCity = addr.city || addr.town || addr.village || addr.county || '';
          const resolvedState = addr.state || '';
          const resolvedPincode = addr.postcode || '';

          const streetPart = [houseNumber, road].filter(Boolean).join(', ');

          if (streetPart) {
            this.addressLine = streetPart;
          }

          if (resolvedState) {
            this.state = resolvedState;
          }

          if (resolvedCity) {
            this.ensureCityInList(resolvedState, resolvedCity);
            this.city = resolvedCity;
          }

          if (resolvedPincode) {
            this.pincode = resolvedPincode;
          }

          if (!resolvedCity && !resolvedState) {
            this.locationError = 'Could not resolve a full address. Please check the details below.';
          }

        } catch {

          this.locationError = 'Could not fetch your address. Please enter it manually.';

        } finally {

          this.locatingUser = false;

        }
      },

      () => {
        this.locatingUser = false;
        this.locationError = 'Location permission denied. Please enter your address manually.';
      }
    );
  }


  /* =====================================================
     PAYMENT
  ====================================================== */

  paymentMethod: 'card' | 'upi' | 'cod' = 'card';

  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';

  upiId = '';


  /* =====================================================
     STATE
  ====================================================== */

  placingOrder = false;

  errorMessage = '';


  /* =====================================================
     CONSTRUCTOR
  ====================================================== */

  constructor(
    public cartService: CommonService,
    private orderService: OrderService,
    private router: Router
  ) { }


  /* =====================================================
     ON INIT
     Pull the customer's saved Billing_* / GSTIN_Number
     columns (from GetCustomerByCode) and pre-fill the
     address form — so a returning customer doesn't have
     to retype anything. First-time customers just see an
     empty form as before.
  ====================================================== */

  ngOnInit(): void {
    this.loadSavedAddress();
  }

  // ============================================================
  // REPLACE the existing loadSavedAddress() in checkout.component.ts
  // with this version. It looks up fields case-insensitively (so
  // it keeps working even if your backend sends Billing_Address /
  // billing_Address / billingAddress etc.) and logs the raw
  // response once so you can confirm the exact keys coming back.
  // ============================================================

  private loadSavedAddress(): void {

    const customerCode = this.getCustomerCode();

    if (!customerCode) {
      return; // not logged in yet -> nothing to pre-fill
    }

    // instant fallback from whatever the navbar/login already stored
    const stored = this.cartService.loggedCustomer();
    if (stored) {
      this.fullName = stored.Customer_Name || stored.Full_Name || stored.Name || this.fullName;
      this.phone = stored.Mobile_No || this.phone;
    }

    this.loadingAddress = true;

    this.cartService.GetCustomerByCode(customerCode).subscribe({

      next: (res: any) => {

        this.loadingAddress = false;

        // TEMP DEBUG — open browser console after this page loads and
        // check what keys are actually inside "data". Once address
        // fields fill correctly you can delete this console.log line.
        console.log('GetCustomerByCode raw response:', res);

        if (!res?.status || !res?.data) {
          return; // first-time customer -> no saved record yet, that's fine
        }

        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!data) {
          return;
        }

        // case-insensitive field lookup — matches Billing_Address,
        // billing_Address, billingAddress, BILLING_ADDRESS, etc.
        const get = (key: string): string => {
          const foundKey = Object.keys(data).find(
            dk => dk.toLowerCase() === key.toLowerCase()
          );
          const value = foundKey ? data[foundKey] : null;
          return value === null || value === undefined ? '' : String(value);
        };

        this.fullName = get('Customer_Name') || this.fullName;
        this.phone = get('Mobile_No') || this.phone;
        this.alternate_phone = get('Alternate_phone') || this.alternate_phone;
        this.landmark = get('Landmark') || this.landmark

        const billingAddress = get('Billing_Address');

        if (billingAddress) {
          this.addressLine = billingAddress;
          this.city = get('Billing_City');
          this.state = get('Billing_State');
          this.pincode = get('Billing_Zipcode');
          this.addressPrefilled = true;

          // ⭐ A saved, valid address already exists — skip straight
          // to the Payment step instead of showing the address form.
          // The person can still tap "Change address" on step 2 to
          // come back here and edit it.
          if (this.checkoutStep === 1 && this.isAddressValid) {
            this.checkoutStep = 2;
          }
        }

        const gstin = get('GSTIN_Number');

        if (gstin) {
          this.gstin = gstin;
          this.needsGstInvoice = true;
        }
      },

      error: (error: any) => {
        console.error('LOAD SAVED ADDRESS ERROR:', error);
        this.loadingAddress = false;
      }
    });
  }


  /* =====================================================
     ADDRESS VALIDATION
  ====================================================== */

  get isAddressValid(): boolean {

    const nameOk =
      this.fullName.trim().length >= 3;

    const phoneOk =
      /^[6-9]\d{9}$/.test(
        this.phone.trim()
      );

    const addressOk =
      this.addressLine.trim().length >= 8;

    const landmarkOk =
      this.landmark.trim().length >= 2;

    const cityOk =
      this.city.trim().length >= 2;

    const stateOk =
      this.state.trim().length > 0;

    const pincodeOk =
      /^\d{6}$/.test(
        this.pincode.trim()
      );

    return (
      nameOk &&
      phoneOk &&
      addressOk &&
      landmarkOk &&
      cityOk &&
      stateOk &&
      pincodeOk &&
      this.isGstinValid
    );
  }


  /* =====================================================
     PAYMENT VALIDATION
     Card/UPI field checks stay only as a quick client-side
     sanity check for the manual-entry panels. The actual
     charge always happens inside the Razorpay widget, which
     does its own full validation.
  ====================================================== */

  get isPaymentValid(): boolean {

    if (this.paymentMethod === 'card') {
      return true; // Card number/expiry/CVV are entered inside Razorpay's own secure form.
    }

    if (this.paymentMethod === 'upi') {
      return true; // UPI ID / QR / app choice happens inside Razorpay's own secure form.
    }

    /* COD */

    return true;
  }


  selectPaymentMethod(
    method: 'card' | 'upi' | 'cod'
  ): void {

    if (this.placingOrder) {
      return;
    }

    this.paymentMethod = method;
    this.errorMessage = '';
  }

  /* =====================================================
     COMPLETE FORM VALIDATION
  ====================================================== */

  get isFormValid(): boolean {

    return (
      this.isAddressValid &&
      this.isPaymentValid
    );
  }


  /* =====================================================
     STEP 1 → STEP 2
  ====================================================== */

  continueToPayment(): void {

    this.errorMessage = '';

    if (!this.isAddressValid) {

      this.errorMessage = this.needsGstInvoice && !this.isGstinValid
        ? 'Please enter a valid 15-character GSTIN, or turn off GST invoice.'
        : 'Please enter valid delivery details before continuing.';

      return;
    }


    this.checkoutStep = 2;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /* =====================================================
     STEP 2 → STEP 1
  ====================================================== */

  backToAddress(): void {

    if (this.placingOrder) {
      return;
    }

    this.errorMessage = '';

    this.checkoutStep = 1;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  /* =====================================================
     CUSTOMER CODE
  ====================================================== */

  private getCustomerCode(): string {

    try {

      const raw =
        localStorage.getItem('customer');

      const customer =
        raw ? JSON.parse(raw) : null;

      return (
        customer?.Customer_Code?.trim() || ''
      );

    } catch {

      return '';

    }
  }


  /* =====================================================
     SAVE ADDRESS FOR NEXT TIME
     Fired after a successful order (COD or paid). Persists
     the address just used into M_CUSTOMER_MASTER so the
     NEXT checkout auto pre-fills via GetCustomerByCode.
     Runs quietly in the background — a failure here should
     never block or roll back an already-placed order.
  ====================================================== */

  private saveAddressForNextTime(customerCode: string): void {

    this.cartService.SaveCustomerAddress({
      Customer_Code: customerCode,
      Customer_Name: this.fullName.trim(),
      Mobile_No: this.phone.trim(),
      Billing_Address: this.addressLine.trim(),
      Alternate_Phone: this.alternate_phone.trim(),
      Landmark: this.landmark.trim(),
      Billing_City: this.city.trim(),
      Billing_State: this.state.trim(),
      Billing_Zipcode: this.pincode.trim(),
      GSTIN_Number: this.needsGstInvoice ? this.gstin.trim().toUpperCase() : ''
    }).subscribe({

      next: (res: any) => {
        if (res?.status && res?.data) {
          // keep navbar / next-visit prefill in sync immediately
          localStorage.setItem(
            'customer',
            JSON.stringify({ ...this.cartService.loggedCustomer(), ...res.data })
          );
          this.cartService.refreshLoggedCustomer();
        }
      },

      error: (error: any) => {
        console.error('SAVE CUSTOMER ADDRESS ERROR:', error);
      }
    });
  }


  /* =====================================================
     RAZORPAY SCRIPT LOADER
  ====================================================== */

  private loadRazorpayScript(): Promise<boolean> {

    return new Promise((resolve) => {

      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }


  /* =====================================================
     PLACE ORDER
     - COD: goes straight to order creation, as before.
     - CARD / UPI: opens the real Razorpay checkout widget so
       money actually moves through a licensed gateway, then
       creates the order only after payment succeeds.

     TODO (backend, required for CARD/UPI to move real money):
       1) Add an endpoint that creates a Razorpay Order
          (amount, currency='INR') using your Razorpay Key
          Secret, and returns { id, amount, currency }.
          Wire it up below as orderService.createPaymentOrder().
       2) After payment, verify razorpay_payment_id /
          razorpay_order_id / razorpay_signature on your
          server using your Key Secret BEFORE fulfilling the
          order. Never trust the frontend for that check.
  ====================================================== */

  async placeOrder(): Promise<void> {

    if (
      !this.isFormValid ||
      this.cartService.totalCount() === 0
    ) {
      return;
    }

    const customerCode = this.getCustomerCode();

    if (!customerCode) {

      this.errorMessage =
        'Please login to place an order.';

      this.router.navigate(['/login']);

      return;
    }

    this.errorMessage = '';
    this.placingOrder = true;

    if (this.paymentMethod === 'cod') {
      this.finalizeOrder(customerCode, 'COD');
      return;
    }

    /* ================= CARD / UPI via Razorpay ================= */

    const scriptLoaded = await this.loadRazorpayScript();

    if (!scriptLoaded) {
      this.placingOrder = false;
      this.errorMessage =
        'Unable to load the payment gateway. Please check your connection and try again.';
      return;
    }

    // TODO: replace this with a real call to your backend, e.g.
    // this.orderService.createPaymentOrder(this.cartService.grandTotal(), (razorpayOrder) => {...}, (msg) => {...});
    //
    // Below is the shape your backend response should have:
    // { id: 'order_xxx', amount: <in paise>, currency: 'INR' }

    if (typeof (this.orderService as any).createPaymentOrder === 'function') {

      (this.orderService as any).createPaymentOrder(

        this.cartService.grandTotal(),

        (razorpayOrder: { id: string; amount: number; currency: string }) => {
          this.openRazorpayCheckout(razorpayOrder, customerCode);
        },

        (message: string) => {
          this.placingOrder = false;
          this.errorMessage = message || 'Could not initiate payment. Please try again.';
        }
      );

    } else {

      this.placingOrder = false;
      this.errorMessage =
        'Online payment is not fully set up yet. Please ask your developer to add the createPaymentOrder backend API (see TODO in checkout.component.ts), or choose Cash on Delivery for now.';
    }
  }


  /* =====================================================
     OPEN RAZORPAY CHECKOUT WIDGET
  ====================================================== */

  private openRazorpayCheckout(
    razorpayOrder: { id: string; amount: number; currency: string },
    customerCode: string
  ): void {

    const options = {

      // TODO: replace with your actual Razorpay Key ID (starts with rzp_test_ or rzp_live_)
      key: 'YOUR_RAZORPAY_KEY_ID',

      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',

      name: 'Your Store Name',
      description: 'Order Payment',

      order_id: razorpayOrder.id,

      method: {
        card: this.paymentMethod === 'card',
        upi: this.paymentMethod === 'upi',
        netbanking: false,
        wallet: false
      },

      prefill: {
        name: this.fullName,
        contact: this.phone
      },

      theme: {
        color: '#2563eb'
      },

      handler: (response: any) => {

        // Payment succeeded on Razorpay's side.
        // Your backend MUST verify response.razorpay_payment_id,
        // response.razorpay_order_id and response.razorpay_signature
        // before treating this as a confirmed, paid order.

        this.finalizeOrder(
          customerCode,
          this.paymentMethod === 'card' ? 'CARD' : 'UPI',
          response.razorpay_payment_id
        );
      },

      modal: {
        ondismiss: () => {
          this.placingOrder = false;
          this.errorMessage = 'Payment was cancelled.';
        }
      }
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (resp: any) => {
      this.placingOrder = false;
      this.errorMessage = resp?.error?.description || 'Payment failed. Please try again.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    rzp.open();
  }


  /* =====================================================
     FINALIZE ORDER (after COD selection or successful payment)
  ====================================================== */

  private finalizeOrder(
    customerCode: string,
    backendPaymentMethod: 'UPI' | 'CARD' | 'GPAY' | 'COD',
    paymentRef?: string
  ): void {

    this.orderService.placeOrder(

      customerCode,

      this.cartService.cartItems(),

      {
        DeliveryAddress:
          `${this.fullName}, ${this.addressLine}, Phone: ${this.phone}`,

        City:
          this.city,

        State:
          this.state,

        Pincode:
          this.pincode,

        // NEW: only sent when the GST-invoice toggle is on.
        GSTIN:
          this.needsGstInvoice ? this.gstin.trim().toUpperCase() : undefined,

        ...(paymentRef ? { PaymentReference: paymentRef } : {})
      },

      backendPaymentMethod,


      /* SUCCESS */

      (order) => {

        // persist this address to M_CUSTOMER_MASTER in the background
        // so the NEXT order auto-fills it via GetCustomerByCode
        this.saveAddressForNextTime(customerCode);

        this.cartService.clearCart();

        this.placingOrder = false;

        this.router.navigate([
          '/order-success',
          order.id
        ]);

      },


      /* ERROR */

      (message) => {

        this.placingOrder = false;

        this.errorMessage =
          message ||
          'Order failed. Please try again.';

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

      }

    );
  }

}