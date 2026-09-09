import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { WishlistService } from '../../core/services/wishlist.service';

import { Product } from '../../core/models/product.model';



import { CommonService } from '../../../service/common.service';

import { Location } from '@angular/common';

import { AdBannerComponent } from '../../shared/components/ad-banner/ad-banner.component';

interface ProductSpecification {
  label: string;
  value: string;
}

// Shape returned by GET api/customer/Get_CustomerReviewList (raw M_CUSTOMER_REVIEW rows)
interface CustomerReviewRow {
  Review_Code: string;
  Customer_Code: string;
  Customer_Name: string;
  Rating: number | string;
  Review_Title?: string;
  Review_Message: string;
  Product_Code: string;
  Product_Name?: string;
  Is_Active?: string;
  Created_On?: string;
}

// Shape read from localStorage after login — matches what LoginComponent
// saves under the "customer" key (LoginCustomer API response's `data`)
interface LoggedCustomer {
  Customer_Code: string;
  Customer_Name: string;
  Email_Id?: string;
  Mobile_No?: string;
  Company_Code?: string;
  Branch_Code?: string;
}


@Component({
  selector: 'app-product-detail',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AdBannerComponent

  ],

  templateUrl: './product-detail.component.html',

  styleUrl: './product-detail.component.scss'
})


export class ProductDetailComponent implements OnInit {


  // =========================================================
  // PRODUCT
  // =========================================================

  product?: Product;

  relatedProducts: Product[] = [];

  loading = true;

  apiProduct: any = null;


  // =========================================================
  // QUANTITY
  // =========================================================

  quantity = 1;


  // =========================================================
  // CART
  // =========================================================

  justAdded = false;


  // =========================================================
  // CUSTOMER REVIEWS — API BASED
  // =========================================================

  reviews: CustomerReviewRow[] = [];

  reviewsLoading = false;

  showReviewForm = false;

  reviewSubmitting = false;

  reviewMessage = '';

  newReview = {
    rating: 0,
    title: '',
    comment: ''
  };


  // =========================================================
  // ⭐ RELATED PRODUCT CARD — IMAGE ERROR MAP
  // (same pattern as ProductsComponent.productImageError)
  // =========================================================

  relatedImageError: {
    [key: string]: boolean
  } = {};


  // =========================================================
  // ⭐ TOAST (bottom-right notification, replaces alert())
  // =========================================================

  toastMessage: string | null = null;

  toastType: 'success' | 'error' = 'success';

  private toastTimer: any = null;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(

    private route: ActivatedRoute,

    private router: Router,

    private service: CommonService,

    private location: Location,

    public wishlistService: WishlistService

  ) { }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      if (!id) {

        console.warn('Product ID not found in URL.');

        this.loading = false;

        return;
      }

      this.getProductDetails(id);

    });


    // -------------------------------------------------------
    // AFTER LOGIN REDIRECT BACK — if the user was sent to login
    // from "Write a Review" and has now returned here with
    // ?writeReview=1, and localStorage confirms they're logged
    // in, auto-open the review form so they don't have to click
    // "Write a Review" again.
    // -------------------------------------------------------

    this.route.queryParamMap.subscribe(qp => {

      if (qp.get('writeReview') === '1' && this.isLoggedIn) {

        setTimeout(() => {

          this.showReviewForm = true;

          document.getElementById('customer-reviews')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

        }, 300);

      }

    });

  }


  // =========================================================
  // LOGGED-IN CUSTOMER — reads the "customer" key that
  // LoginComponent.onLogin() saves after a successful login
  // =========================================================

  get loggedCustomer(): LoggedCustomer | null {

    try {

      const raw = localStorage.getItem('customer');

      return raw ? JSON.parse(raw) as LoggedCustomer : null;

    } catch {

      return null;

    }

  }

  get isLoggedIn(): boolean {

    return !!this.loggedCustomer?.Customer_Code;

  }


  // =========================================================
  // GET PRODUCT DETAILS
  // =========================================================

  getProductDetails(id: string): void {

    this.loading = true;

    this.service.GetAllProducts().subscribe({

      next: (res: any) => {

        if (res?.status === true && Array.isArray(res?.data)) {

          const selectedItem = res.data.find(
            (item: any) =>
              String(item.U_Id) === String(id) ||
              String(item.Product_Code) === String(id)
          );

          if (selectedItem) {

            this.apiProduct = selectedItem;

            this.product = this.mapToProduct(selectedItem);

            this.quantity = 1;

            this.loadReviews();

            this.relatedProducts = res.data

              .filter(
                (item: any) =>
                  item.Category_Name === selectedItem.Category_Name &&
                  String(item.U_Id) !== String(selectedItem.U_Id)
              )

              .map((item: any) => this.mapToProduct(item));

          } else {

            console.warn('Product not found:', id);

            this.product = undefined;

            this.relatedProducts = [];

          }

        } else {

          console.warn('API returned no product data.');

          this.product = undefined;

          this.relatedProducts = [];

        }

        this.loading = false;

      },

      error: (error: any) => {

        console.error('GET PRODUCT DETAILS API ERROR:', error);

        this.product = undefined;

        this.relatedProducts = [];

        this.loading = false;

      }

    });

  }


  private extractNumber(value: any): number {

    if (value === null || value === undefined || value === '') {

      return 0;

    }

    const match = String(value).match(/[\d.]+/);

    return match ? Number(match[0]) : 0;

  }


  private getProductTag(item: any): string {

    const stock = Number(item.CurrentStock) || 0;

    const mrp = Number(item.Mrp_Price) || 0;

    const price = Number(item.Selling_Price) || 0;

    if (stock <= 0) {

      return 'Out of Stock';

    }

    if (mrp > price && mrp > 0) {

      return 'Best Deal';

    }

    return '';

  }


  parseSpecifications(specificationText: any): ProductSpecification[] {

    if (!specificationText || String(specificationText).trim() === '') {

      return [];

    }

    const lines = String(specificationText)

      .replace(/\r/g, '')

      .split('\n')

      .map(line => line.trim())

      .filter(line => line.length > 0);

    return lines.map(line => {

      const colonIndex = line.indexOf(':');

      if (colonIndex === -1) {

        return { label: 'Details', value: line };

      }

      return {

        label: line.substring(0, colonIndex).trim(),

        value: line.substring(colonIndex + 1).trim()

      };

    });

  }


  private mapToProduct(item: any): Product {

    return {

      id: item.U_Id || item.ProductId || item.Product_Code,

      productCode: item.Product_Code || '',

      name: item.Product_Name || item.Online_Display_Name || item.Print_Name || '',

      shortName: item.Online_Display_Name || item.Product_Name || '',

      category: item.Category_Name || '',

      brand: item.Brand_Name || '',

      description: item.Description || item.Spec_Details || '',

      price: Number(item.Selling_Price) || 0,

      mrp: Number(item.Mrp_Price) || 0,

      oldPrice: Number(item.Mrp_Price) || 0,

      costPrice: Number(item.Cost_Price) || 0,

      gst: this.extractNumber(item.Gst_Per),

      stock: Number(item.CurrentStock) || 0,

      sku: item.SKU || '',

      barcode: item.Barcode || '',

      modelNo: item.Model_No || '',

      color: item.Color_Name || '',

      warranty: item.Warranty_Name || item.Warranty_Period || '',

      image: item.Product_Image || item.ProdImgUrl || '',

      isActive: item.Is_Active === 'A',

      rating: Number(item.Star_Rating) || 0,

      reviews: 0,

      specs: this.parseSpecifications(item.Specifications),

      tag: this.getProductTag(item),

      apiData: item

    } as Product;

  }


  // =========================================================
  // DERIVED DISPLAY GETTERS
  // =========================================================

  get specDetails(): string {

    return this.apiProduct?.Spec_Details || this.apiProduct?.Description || '';

  }

  get apiRating(): number {

    const rating = Number(this.apiProduct?.Star_Rating);

    return isNaN(rating) ? 0 : Math.max(0, Math.min(5, rating));

  }

  get stars(): number[] {

    return [1, 2, 3, 4, 5];

  }

  getStarType(star: number): 'full' | 'half' | 'empty' {

    return this.getStarTypeFor(this.apiRating, star);

  }

  private getStarTypeFor(rating: number, star: number): 'full' | 'half' | 'empty' {

    if (rating >= star) {

      return 'full';

    }

    if (rating >= star - 0.5 && rating < star) {

      return 'half';

    }

    return 'empty';

  }


  // =========================================================
  // QUANTITY / CART / WISHLIST
  // =========================================================

  changeQuantity(delta: number): void {

    if (!this.product) {

      return;

    }

    this.quantity = Math.max(1, Math.min(this.quantity + delta, this.product.stock));

  }


  // =========================================================
  // ADD TO CART
  // =========================================================

  addToCart(): void {

    if (!this.product) {

      return;

    }

    const customer = this.loggedCustomer;

    if (!customer?.Customer_Code) {

      this.showToast('Please login to add products to cart.', 'error');

      setTimeout(() => {

        this.router.navigate(['/login']);

      }, 1200);

      return;

    }

    const productCode = String(
      this.product.productCode || ''
    ).trim();

    if (!productCode) {

      this.showToast('Product Code not found.', 'error');

      console.error(
        'Product Code not found:',
        this.product
      );

      return;

    }

    const qty = Math.max(
      1,
      Number(this.quantity) || 1
    );

    // =====================================================
    // ⭐ USE commonService.addToCart() — updates cart signal
    // INSTANTLY so the navbar badge changes immediately,
    // same as how wishlist behaves.
    // =====================================================

    this.service.addToCart(

      this.product,
      qty,

      // onSuccess
      () => {

        this.justAdded = true;

        this.showToast(
          `${this.product?.name} added to cart successfully.`,
          'success'
        );

        setTimeout(() => {

          this.justAdded = false;

        }, 1500);

      },

      // onError
      (message) => {

        this.showToast(
          message || 'Unable to add product to cart.',
          'error'
        );

      }

    );

  }

  // =========================================================
  // BUY NOW
  // =========================================================

  buyNow(): void {

    if (!this.product) {

      return;

    }

    const customer = this.loggedCustomer;

    if (!customer?.Customer_Code) {

      this.showToast('Please login to continue.', 'error');

      setTimeout(() => {

        this.router.navigate(['/login']);

      }, 1200);

      return;

    }

    const productCode = String(
      this.product.productCode || ''
    ).trim();

    if (!productCode) {

      this.showToast('Product Code not found.', 'error');

      return;

    }

    const qty = Math.max(
      1,
      Number(this.quantity) || 1
    );

    this.service.addToCart(

      this.product,
      qty,

      // onSuccess
      () => {

        this.router.navigate(['/cart']);

      },

      // onError
      (message) => {

        this.showToast(
          message || 'Unable to add product to cart.',
          'error'
        );

      }

    );

  }


  toggleWishlist(): void {

    if (this.product) {

      this.wishlistService.toggle(this.product);

    }

  }


  // =========================================================
  // PRICE / STOCK
  // =========================================================

  get discountPercent(): number | null {

    if (!this.product?.mrp || this.product.mrp <= this.product.price) {

      return null;

    }

    return Math.round(((this.product.mrp - this.product.price) / this.product.mrp) * 100);

  }

  get savings(): number {

    if (!this.product) {

      return 0;

    }

    return Math.max(0, this.product.mrp - this.product.price);

  }

  get stockStatus(): string {

    const stock = this.product?.stock || 0;

    if (stock <= 0) {

      return 'Out of Stock';

    }

    if (stock <= 5) {

      return 'Only few left';

    }

    return 'In Stock';

  }

  get stockClass(): string {

    const stock = this.product?.stock || 0;

    if (stock <= 0) {

      return 'stock-out';

    }

    if (stock <= 5) {

      return 'stock-low';

    }

    return 'stock-good';

  }


  // =========================================================
  // API META GETTERS (used in Specifications / Additional Info)
  // =========================================================

  get minimumStock(): string { return this.apiProduct?.Minimum_Stock || '-'; }

  get maximumStock(): string { return this.apiProduct?.Maximum_Stock || '-'; }

  get hsn(): string { return this.apiProduct?.Hsn || this.apiProduct?.Hsn_Code || '-'; }

  get gstType(): string { return this.apiProduct?.Gst_Type || '-'; }

  get productType(): string { return this.apiProduct?.Product_Type || '-'; }

  get uom(): string { return this.apiProduct?.Uom_Name || this.apiProduct?.Uom_Code || '-'; }

  get companyCode(): string { return this.apiProduct?.Company_Code || '-'; }

  get branchCode(): string { return this.apiProduct?.Branch_Code || '-'; }

  get inventoryType(): string { return this.apiProduct?.Inventory_Type || '-'; }

  get warranty(): string {

    return this.apiProduct?.Warranty_Name || this.apiProduct?.Warranty_Period || 'Not specified';

  }


  // =========================================================
  // CUSTOMER REVIEWS — API
  // =========================================================

  loadReviews(): void {

    if (!this.product) {

      return;

    }

    this.reviewsLoading = true;

    this.service.GetCustomerReviewList().subscribe({

      next: (res: any) => {

        if (res?.status === true && Array.isArray(res?.data)) {

          this.reviews = res.data

            .filter((r: any) =>
              String(r.Product_Code) === String(this.product?.productCode) &&
              r.Is_Active !== 'D'
            )

            .sort((a: any, b: any) => {

              const dateA = new Date(String(a.Created_On).replace(/\s+/g, ' ')).getTime();

              const dateB = new Date(String(b.Created_On).replace(/\s+/g, ' ')).getTime();

              return dateB - dateA;

            });

        } else {

          this.reviews = [];

        }

        this.reviewsLoading = false;

      },

      error: (error: any) => {

        console.error('GET CUSTOMER REVIEW LIST ERROR:', error);

        this.reviews = [];

        this.reviewsLoading = false;

      }

    });

  }

  get reviewCount(): number {

    return this.reviews.length;

  }

  get reviewAverage(): number {

    if (!this.reviews.length) {

      return this.apiRating;

    }

    const total = this.reviews.reduce((sum, r) => sum + (Number(r.Rating) || 0), 0);

    return Number((total / this.reviews.length).toFixed(1));

  }

  getReviewSummaryStarType(star: number): 'full' | 'half' | 'empty' {

    return this.getStarTypeFor(this.reviewAverage, star);

  }

  getReviewCountForStar(star: number): number {

    return this.reviews.filter(r => Math.round(Number(r.Rating)) === star).length;

  }

  getReviewPercentage(star: number): number {

    if (!this.reviewCount) {

      return 0;

    }

    return Math.round((this.getReviewCountForStar(star) / this.reviewCount) * 100);

  }

  getInitial(name: string | undefined | null): string {

    if (!name || !name.trim()) {
      return '?';
    }

    return name.trim().charAt(0).toUpperCase();

  }

  isFilledStar(review: CustomerReviewRow, star: number): boolean {

    return star <= Math.round(Number(review.Rating) || 0);

  }


  // =========================================================
  // WRITE REVIEW — redirect to login if not logged in,
  // come straight back here (with the form open) after login
  // =========================================================

  openReviewForm(): void {

    if (!this.isLoggedIn) {

      const returnUrl = `${this.router.url.split('?')[0]}?writeReview=1#customer-reviews`;

      this.router.navigate(['/login'], {
        queryParams: { returnUrl }
      });

      return;

    }

    this.showReviewForm = true;

    this.reviewMessage = '';

  }

  closeReviewForm(): void {

    this.showReviewForm = false;

    this.reviewMessage = '';

  }

  setReviewRating(rating: number): void {

    this.newReview.rating = rating;

  }

  submitReview(): void {

    this.reviewMessage = '';

    if (!this.isLoggedIn) {

      return;

    }

    if (!this.newReview.rating) {

      this.reviewMessage = 'Please select a rating.';

      return;

    }

    if (!this.newReview.comment.trim()) {

      this.reviewMessage = 'Please write your review.';

      return;

    }

    if (!this.product) {

      return;

    }

    this.reviewSubmitting = true;

    const customer = this.loggedCustomer!;

    const payload = {

      Customer_Code: customer.Customer_Code,

      Customer_Name: customer.Customer_Name,

      Email_Id: customer.Email_Id || '',

      Mobile_No: customer.Mobile_No || '',

      Rating: String(this.newReview.rating),

      Review_Title: this.newReview.title.trim(),

      Review_Message: this.newReview.comment.trim(),

      Product_Code: this.product.productCode,

      Product_Name: this.product.name,

      Created_By: customer.Customer_Code,

      Company_Code: customer.Company_Code || this.apiProduct?.Company_Code || '',

      Branch_Code: customer.Branch_Code || this.apiProduct?.Branch_Code || ''

    };

    this.service.SaveCustomerReview(payload).subscribe({

      next: (res: any) => {

        this.reviewSubmitting = false;

        if (res?.status === true) {

          this.newReview = { rating: 0, title: '', comment: '' };

          this.showReviewForm = false;

          this.reviewMessage = 'Thank you! Your review has been submitted.';

          this.loadReviews();

        } else {

          this.reviewMessage = res?.message || 'Review submission failed.';

        }

      },

      error: (error: any) => {

        console.error('SAVE CUSTOMER REVIEW ERROR:', error);

        this.reviewSubmitting = false;

        this.reviewMessage = 'Something went wrong. Please try again.';

      }

    });

  }

  openReviews(): void {

    setTimeout(() => {

      document.getElementById('customer-reviews')?.scrollIntoView({

        behavior: 'smooth',

        block: 'start'

      });

    }, 50);

  }

  getRelatedDiscount(item: Product): number {

    if (!item?.mrp || item.mrp <= item.price) {
      return 0;
    }

    return Math.round(((item.mrp - item.price) / item.mrp) * 100);

  }

  // =========================================================
  // SELECT RELATED PRODUCT — NO PAGE NAVIGATION.
  // Same page-layout ah product data replace pannidum.
  // =========================================================
  selectRelatedProduct(item: Product): void {

    if (!item?.id) {
      return;
    }

    this.showReviewForm = false;
    this.justAdded = false;
    this.quantity = 1;

    this.getProductDetails(String(item.id));

    // URL address bar update aagum, but page reload/navigate aagathu
    this.location.replaceState(`/product/${item.id}`);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  }

  addRelatedProductToCart(product: Product, event: Event): void {

    event.preventDefault();
    event.stopPropagation();

    if (!product) {
      return;
    }

    const customerJson = localStorage.getItem('customer');

    if (!customerJson) {
      this.showToast('Please login to add products to cart.', 'error');
      setTimeout(() => { this.router.navigate(['/login']); }, 1200);
      return;
    }

    let customer: LoggedCustomer;

    try {
      customer = JSON.parse(customerJson);
    } catch {
      this.showToast('Customer login information is invalid. Please login again.', 'error');
      localStorage.removeItem('customer');
      setTimeout(() => { this.router.navigate(['/login']); }, 1200);
      return;
    }

    if (!customer?.Customer_Code) {
      this.showToast('Please login to add products to cart.', 'error');
      setTimeout(() => { this.router.navigate(['/login']); }, 1200);
      return;
    }

    const productCode = String(product.productCode || '').trim();

    if (!productCode) {
      console.error('Related product code missing:', product);
      this.showToast('Product Code not found.', 'error');
      return;
    }

    // =====================================================
    // ⭐ USE commonService.addToCart() — instant navbar badge update
    // =====================================================

    this.service.addToCart(

      product,
      1,

      // onSuccess
      () => {
        this.showToast(`${product.name} added to cart successfully.`, 'success');
      },

      // onError
      (message) => {
        this.showToast(message || 'Unable to add product to cart.', 'error');
      }

    );

  }

  // =========================================================
  // ⭐ RELATED PRODUCT CARD HELPERS
  // (same shape as ProductsComponent's card helpers, so the
  // card here looks/behaves exactly like the Products page card)
  // =========================================================

  getRelatedKey(item: any): string {

    return String(
      item?.productCode ??
      item?.productCode ??
      item?.Product_Code ??
      ''
    );

  }

  onRelatedImageError(item: any): void {

    const key = this.getRelatedKey(item);

    this.relatedImageError = {
      ...this.relatedImageError,
      [key]: true
    };

  }

  isRelatedWishlisted(item: any): boolean {

    return this.wishlistService.isWishlisted(
      this.getRelatedKey(item)
    );

  }

  toggleRelatedWishlist(item: Product, event: Event): void {

    event.stopPropagation();
    event.preventDefault();

    this.wishlistService.toggle(item);

  }

  relatedStarsArray(count: number): number[] {

    const safeCount = Math.max(0, Math.floor(count));

    return Array(safeCount).fill(0);

  }

  relatedRoundedRating(item: any): number {

    const rating = Number(item?.rating ?? 0) || 0;

    return Math.min(5, Math.max(0, Math.round(rating)));

  }


  // =========================================================
  // ⭐ TOAST HELPERS
  // =========================================================

  showToast(
    message: string,
    type: 'success' | 'error' = 'success',
    duration: number = 3000
  ): void {

    if (this.toastTimer) {

      clearTimeout(this.toastTimer);

    }

    this.toastMessage = message;

    this.toastType = type;

    this.toastTimer = setTimeout(() => {

      this.toastMessage = null;

      this.toastTimer = null;

    }, duration);

  }

  closeToast(): void {

    if (this.toastTimer) {

      clearTimeout(this.toastTimer);

      this.toastTimer = null;

    }

    this.toastMessage = null;

  }

}

