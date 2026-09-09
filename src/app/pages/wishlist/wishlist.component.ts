import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  Router,
  RouterLink
} from '@angular/router';

import {
  WishlistService
} from '../../core/services/wishlist.service';

import {
  CommonService
} from '../../../service/common.service';

import {
  Product
} from '../../core/models/product.model';


@Component({
  selector: 'app-wishlist',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl:
    './wishlist.component.html',

  styleUrl:
    './wishlist.component.scss'
})
export class WishlistComponent {

  // =========================================================
  // IMAGE ERROR
  // =========================================================

  imageError: {
    [key: string]: boolean
  } = {};


  // =========================================================
  // TOAST
  // =========================================================

  toastMessage:
    string | null = null;

  toastType:
    'success' | 'error' = 'success';

  private toastTimer:
    any = null;


  constructor(
    public wishlistService:
      WishlistService,

    private service:
      CommonService,

    private router:
      Router
  ) {}


  // =========================================================
  // PRODUCT KEY
  // =========================================================

  getKey(item: Product): string {

    return String(
      item?.productCode ??
      item?.id ??
      ''
    );
  }


  // =========================================================
  // NAME
  // =========================================================

  getName(item: Product): string {

    return (
      item?.name ||
      'Unnamed Product'
    );
  }


  // =========================================================
  // IMAGE
  // =========================================================

  getImage(item: Product): string {

    return (
      item?.image ||
      ''
    );
  }


  // =========================================================
  // PRICE
  // =========================================================

  getPrice(item: Product): number {

    return Number(
      item?.price
    ) || 0;
  }


  // =========================================================
  // OLD PRICE
  // =========================================================

  getOldPrice(item: Product): number {

    return Number(
      item?.mrp
    ) || 0;
  }


  // =========================================================
  // DISCOUNT
  // =========================================================

  getDiscount(item: Product): number {

    const oldPrice =
      this.getOldPrice(item);

    const price =
      this.getPrice(item);


    if (
      !oldPrice ||
      oldPrice <= price
    ) {

      return 0;
    }


    return Math.round(
      (
        (oldPrice - price) /
        oldPrice
      ) * 100
    );
  }


  // =========================================================
  // CATEGORY
  // =========================================================

  getCategory(item: Product): string {

    return (
      item?.category ||
      ''
    );
  }


  // =========================================================
  // BRAND
  // =========================================================

  getBrand(item: Product): string {

    return (
      item?.brand ||
      ''
    );
  }


  // =========================================================
  // DESCRIPTION
  // =========================================================

  getShortDescription(
    item: Product,
    limit: number = 80
  ): string {

    const desc =
      (
        item?.description ||
        ''
      ).trim();


    if (!desc) {
      return '';
    }


    return desc.length <= limit
      ? desc
      : desc.substring(
          0,
          limit
        ).trim() + '...';
  }


  // =========================================================
  // RATING
  // =========================================================

  getRating(item: Product): number {

    return Number(
      item?.rating
    ) || 0;
  }


  // =========================================================
  // ROUNDED RATING
  // =========================================================

  roundedRating(
    item: Product
  ): number {

    return Math.min(
      5,
      Math.max(
        0,
        Math.round(
          this.getRating(item)
        )
      )
    );
  }


  // =========================================================
  // STARS
  // =========================================================

  starsArray(
    count: number
  ): number[] {

    return Array(
      Math.max(
        0,
        Math.floor(count)
      )
    ).fill(0);
  }


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onImageError(
    item: Product
  ): void {

    const key =
      this.getKey(item);


    this.imageError = {

      ...this.imageError,

      [key]: true

    };
  }


  // =========================================================
  // PRODUCT DETAIL
  // =========================================================

  goToProduct(
    item: Product
  ): void {

    const productCode =
      this.getKey(item);


    if (!productCode) {
      return;
    }


    this.router.navigate([
      '/product',
      productCode
    ]);
  }


  // =========================================================
  // REMOVE WISHLIST
  //
  // ONLY HEART CLICK SHOULD REMOVE / DEACTIVATE.
  // =========================================================

  removeFromWishlist(
    item: Product,
    event: Event
  ): void {

    event.stopPropagation();
    event.preventDefault();


    const productCode =
      String(
        item?.productCode ||
        item?.id ||
        ''
      ).trim();


    if (!productCode) {

      this.showToast(
        'Product code not found.',
        'error'
      );

      return;
    }


    // =======================================================
    // THIS WILL CHANGE:
    //
    // Is_Active = A
    //        ↓
    // Is_Active = D
    //
    // =======================================================

    this.wishlistService.remove(
      productCode
    );


    this.showToast(
      `${this.getName(item)} removed from wishlist.`,
      'success'
    );
  }


  // =========================================================
  // CUSTOMER
  // =========================================================

  private getStoredCustomer(): any | null {

    try {

      const raw =
        localStorage.getItem(
          'customer'
        );

      return raw
        ? JSON.parse(raw)
        : null;

    } catch {

      return null;
    }
  }


  // =========================================================
  // ADD TO CART
  // =========================================================

  addToCart(
    item: Product,
    event: Event
  ): void {

    event.stopPropagation();
    event.preventDefault();


    const customer =
      this.getStoredCustomer();


    if (
      !customer ||
      !customer.Customer_Code
    ) {

      this.showToast(
        'Please login to add products to cart.',
        'error'
      );


      setTimeout(() => {

        this.router.navigate([
          '/login'
        ]);

      }, 1200);


      return;
    }


    // =======================================================
    // EXISTING PRODUCT CODE
    // =======================================================

    const productCode =
      String(
        item?.productCode ||
        item?.id ||
        ''
      ).trim();


    if (!productCode) {

      this.showToast(
        'Product Code not found.',
        'error'
      );

      return;
    }


    this.service.addToCart(

      item,

      1,

      // SUCCESS
      () => {

        this.showToast(
          `${this.getName(item)} added to cart successfully.`,
          'success'
        );
      },

      // ERROR
      (message) => {

        this.showToast(
          message ??
          'Unable to add product to cart.',
          'error'
        );
      }

    );
  }


  // =========================================================
  // TOAST
  // =========================================================

  showToast(
    message: string,
    type: 'success' | 'error' = 'success',
    duration: number = 3000
  ): void {

    if (this.toastTimer) {

      clearTimeout(
        this.toastTimer
      );
    }


    this.toastMessage =
      message;

    this.toastType =
      type;


    this.toastTimer =
      setTimeout(() => {

        this.toastMessage =
          null;

        this.toastTimer =
          null;

      }, duration);
  }


  // =========================================================
  // CLOSE TOAST
  // =========================================================

  closeToast(): void {

    if (this.toastTimer) {

      clearTimeout(
        this.toastTimer
      );

      this.toastTimer =
        null;
    }


    this.toastMessage =
      null;
  }

}