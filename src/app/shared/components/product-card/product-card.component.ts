import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StarRatingComponent
  ],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {

  @Input({ required: true })
  product!: Product;

  @Output()
  addedToCart = new EventEmitter<Product>();

  justAdded = false;
  addingToCart = false;

  constructor(
    public cartService: CartService,
    public wishlistService: WishlistService
  ) {}

  // ============================================================
  // WISHLIST
  // ============================================================

  toggleWishlist(event: Event): void {

    event.preventDefault();
    event.stopPropagation();

    if (!this.product || !this.product.id) {
      return;
    }

    this.wishlistService.toggle(this.product);
  }

  // ============================================================
  // ADD TO CART
  // ============================================================

  addToCart(event: Event): void {

    // Stop product detail navigation
    event.preventDefault();
    event.stopPropagation();

    if (!this.product) {
      return;
    }

    if (!this.product.id) {
      console.error(
        'Product ID is missing:',
        this.product
      );
      return;
    }

    // Check stock
    if (
      this.product.stock !== undefined &&
      this.product.stock !== null &&
      this.product.stock <= 0
    ) {
      return;
    }

    // Prevent multiple clicks
    if (this.addingToCart) {
      return;
    }

    this.addingToCart = true;

    try {

      /*
       * CartService.addToCart() returns VOID.
       *
       * Therefore DO NOT assign its result to a variable
       * and DO NOT check result.subscribe().
       */

      this.cartService.addToCart(
        this.product,
        1
      );

      // Successfully triggered CartService
      this.cartAddedSuccessfully();

    } catch (error) {

      console.error(
        'Add To Cart Error:',
        error
      );

      this.addingToCart = false;
      this.justAdded = false;
    }
  }

  // ============================================================
  // CART SUCCESS
  // ============================================================

  private cartAddedSuccessfully(): void {

    this.addingToCart = false;

    this.justAdded = true;

    this.addedToCart.emit(this.product);

    setTimeout(() => {

      this.justAdded = false;

    }, 1200);
  }

  // ============================================================
  // DISCOUNT
  // ============================================================

  get discountPercent(): number | null {

    if (!this.product) {
      return null;
    }

    if (!this.product.oldPrice) {
      return null;
    }

    if (this.product.oldPrice <= this.product.price) {
      return null;
    }

    return Math.round(
      (
        (this.product.oldPrice - this.product.price) /
        this.product.oldPrice
      ) * 100
    );
  }
}