import {
  Component,
  HostListener,
  Input
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CommonService } from '../../../service/common.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { environment } from '../../../environments/environment';
// NOTE: adjust the two import paths above if your folder depth differs —
// this file assumes shared/components/product-card/ sits at the same
// depth as core/services/ and one level under app/.

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {

  // =========================================================
  // PRODUCT
  // =========================================================

  @Input() product: any;

  // =========================================================
  // QUICK VIEW
  // =========================================================

  quickViewOpen = false;
  quantity = 1;

  // =========================================================
  // IMAGE
  // =========================================================

  imageError = false;

  // =========================================================
  // TOAST (same pattern as products page)
  // =========================================================

  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private router: Router,
    private service: CommonService,
    private wishlistService: WishlistService
  ) {}

  // =========================================================
  // PRODUCT HELPERS — same field-fallback pattern as products page
  // =========================================================

  getProductName(product: any): string {
    return String(
      product?.name ??
      product?.Product_Name ??
      product?.ProductName ??
      'Unnamed Product'
    );
  }

  // ---- IMAGE URL (normalized to an absolute URL so it survives a
  //      full page refresh regardless of which route rendered it) ----

  getProductImage(product: any): string {
    const raw =
      product?.image ||
      product?.ProdImgUrl ||
      product?.Product_Image ||
      product?.Image_Path ||
      '';

    if (!raw) {
      return '';
    }

    // already absolute (http/https) or a data URL — use as-is
    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) {
      return raw;
    }

    // relative path from the API (e.g. "/Uploads/xyz.jpg") — prefix
    // with the API base URL so it resolves correctly on any route.
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${base}${path}`;
  }

  getProductPrice(product: any): number {
    return Number(
      product?.price ??
      product?.Selling_Price ??
      product?.SellingPrice ??
      0
    ) || 0;
  }

  getOldPrice(product: any): number {
    return Number(
      product?.mrp ??
      product?.Mrp_Price ??
      product?.Mrp ??
      0
    ) || 0;
  }

  getDiscount(product: any): number {
    const oldPrice = this.getOldPrice(product);
    const price = this.getProductPrice(product);

    if (!oldPrice || oldPrice <= price) {
      return 0;
    }

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  getCategory(product: any): string {
    return String(product?.category ?? product?.Category_Name ?? '');
  }

  getBrand(product: any): string {
    return String(product?.brand ?? product?.Brand_Name ?? '');
  }

  getRating(product: any): number {
    return Number(
      product?.rating ??
      product?.Star_Rating ??
      product?.Rating ??
      0
    ) || 0;
  }

  getRoundedRating(product: any): number {
    return Math.min(5, Math.max(0, Math.round(this.getRating(product))));
  }

  starsArray(count: number): number[] {
    return Array(Math.max(0, Math.floor(count))).fill(0);
  }

  getProductDescription(product: any): string {
    return String(product?.description ?? product?.Description ?? '');
  }

  getShortDescription(product: any, limit: number = 80): string {
    const desc = this.getProductDescription(product).trim();

    if (!desc) {
      return '';
    }

    return desc.length <= limit
      ? desc
      : desc.substring(0, limit).trim() + '...';
  }

  getProductCode(product: any): string {
    return String(
      product?.productCode ??
      product?.Product_Code ??
      ''
    ).trim();
  }

  getProductKey(product: any): string {
    return String(product?.id ?? this.getProductCode(product) ?? '');
  }

  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onImageError(): void {
    this.imageError = true;
  }

  // =========================================================
  // QUICK VIEW
  // =========================================================

  openQuickView(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    this.quantity = 1;
    this.quickViewOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.quickViewOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.quickViewOpen) {
      this.closeQuickView();
    }
  }

  increaseQuantity(): void {
    const maxStock = Number(this.product?.stock) || 0;
    this.quantity = maxStock > 0
      ? Math.min(this.quantity + 1, maxStock)
      : this.quantity + 1;
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  // =========================================================
  // GO TO PRODUCT DETAIL
  // =========================================================

  goToProduct(): void {
    this.router.navigate(['/product', this.getProductKey(this.product)]);
  }

  // =========================================================
  // WISHLIST — reads live from the service, no local boolean
  // (stays correct across pages / after refresh)
  // =========================================================

  isWishlisted(): boolean {
    return this.wishlistService.isWishlisted(this.getProductKey(this.product));
  }

  toggleWishlist(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    this.wishlistService.toggle(this.product);
  }

  // =========================================================
  // CUSTOMER FROM LOCAL STORAGE — same lookup as products page
  // =========================================================

  private getStoredCustomer(): any | null {
    try {
      const possibleKeys = [
        'customer', 'Customer', 'customerData', 'CustomerData',
        'loggedInCustomer', 'LoggedInCustomer',
        'customerDetails', 'CustomerDetails'
      ];

      for (const key of possibleKeys) {
        const stored = localStorage.getItem(key);
        if (!stored) continue;

        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.Customer_Code) {
            return parsed;
          }
        } catch {
          // not JSON — keep checking
        }
      }

      const directCode = localStorage.getItem('Customer_Code');
      if (directCode) {
        return { Customer_Code: directCode };
      }

      return null;
    } catch (error) {
      console.error('LOCAL STORAGE CUSTOMER READ ERROR:', error);
      return null;
    }
  }

  // =========================================================
  // ADD TO CART — same flow as products page: login check,
  // then commonService.addToCart() so the cart signal (and
  // navbar badge) update INSTANTLY, same as wishlist.
  // =========================================================

  addToCart(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {
      this.showToast('Please login to add products to cart.', 'error');

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

      return;
    }

    const productCode = this.getProductCode(this.product);

    if (!productCode) {
      this.showToast('Product Code not found.', 'error');
      return;
    }

    const qty = this.quickViewOpen ? this.quantity : 1;

    this.service.addToCart(

      this.product,
      qty,

      // onSuccess
      () => {
        this.showToast(
          `${this.getProductName(this.product)} added to cart successfully.`,
          'success'
        );
        this.closeQuickView();
      },

      // onError
      (message) => {
        this.showToast(message ?? 'Unable to add product to cart.', 'error');
      }

    );
  }


  buyNow(event?: Event): void {
    event?.stopPropagation();
    event?.preventDefault();

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {
      this.showToast('Please login to continue.', 'error');
      this.closeQuickView();

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

      return;
    }

    const productCode = this.getProductCode(this.product);

    if (!productCode) {
      this.showToast('Product Code not found.', 'error');
      return;
    }

    this.service.addToCart(

      this.product,
      this.quantity,

      // onSuccess
      () => {
        this.closeQuickView();
        this.router.navigate(['/cart']);
      },

      // onError
      (message) => {
        this.showToast(message ?? 'Unable to add product to cart.', 'error');
      }

    );
  }

  // =========================================================
  // TOAST
  // =========================================================

  showToast(message: string, type: 'success' | 'error' = 'success', duration: number = 3000): void {
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