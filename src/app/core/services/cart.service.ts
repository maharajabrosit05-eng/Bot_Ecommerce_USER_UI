import { Injectable, computed, signal } from '@angular/core';

import { CartItem, Product } from '../models/product.model';


const STORAGE_KEY = 'electro-shop-cart';


@Injectable({
  providedIn: 'root'
})


export class CartService {


  // =========================================================
  // CART ITEMS SIGNAL
  // =========================================================

  private readonly items =
    signal<CartItem[]>(
      this.loadFromStorage()
    );


  // =========================================================
  // CART ITEMS
  // =========================================================

  readonly cartItems =
    computed(() => this.items());


  // =========================================================
  // TOTAL COUNT
  // =========================================================

  readonly totalCount =
    computed(() =>
      this.items().reduce(
        (sum, i) =>
          sum + i.quantity,
        0
      )
    );


  // =========================================================
  // SUB TOTAL
  // =========================================================

  readonly subTotal =
    computed(() =>
      this.items().reduce(
        (sum, i) =>
          sum +
          i.product.price *
          i.quantity,
        0
      )
    );


  // =========================================================
  // SHIPPING
  // =========================================================

  readonly shipping =
    computed(() =>
      (
        this.subTotal() > 5000 ||
        this.subTotal() === 0
      )
        ? 0
        : 199
    );


  // =========================================================
  // GRAND TOTAL
  // =========================================================

  readonly grandTotal =
    computed(() =>
      this.subTotal() +
      this.shipping()
    );


  // =========================================================
  // ADD TO CART
  // =========================================================

  addToCart(
    product: Product,
    quantity = 1
  ): void {


    const list = [
      ...this.items()
    ];


    // -------------------------------------------------------
    // FIND EXISTING PRODUCT
    // -------------------------------------------------------

    const existing =
      list.find(
        i =>
          i.product.id ===
          product.id
      );


    // -------------------------------------------------------
    // PRODUCT ALREADY EXISTS
    // -------------------------------------------------------

    if (existing) {


      existing.quantity =
        Math.min(
          existing.quantity + quantity,
          product.stock
        );


    }

    // -------------------------------------------------------
    // NEW PRODUCT
    // -------------------------------------------------------

    else {


      list.push({

        product,

        quantity:
          Math.min(
            quantity,
            product.stock
          )

      });


    }


    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    this.commit(list);

  }


  // =========================================================
  // UPDATE QUANTITY
  // =========================================================

  updateQuantity(
    productId: string,
    quantity: number
  ): void {


    const list =
      this.items().map(

        i =>

          i.product.id === productId

            ? {
                ...i,

                quantity:
                  Math.max(
                    1,
                    Math.min(
                      quantity,
                      i.product.stock
                    )
                  )
              }

            : i

      );


    this.commit(list);

  }


  // =========================================================
  // REMOVE FROM CART
  // =========================================================

  removeFromCart(
    productId: string
  ): void {


    this.commit(

      this.items().filter(

        i =>
          i.product.id !==
          productId

      )

    );

  }


  // =========================================================
  // CLEAR CART
  // =========================================================

  clearCart(): void {

    this.commit([]);

  }


  // =========================================================
  // CHECK PRODUCT IN CART
  // =========================================================

  isInCart(
    productId: string
  ): boolean {


    return this.items().some(

      i =>
        i.product.id ===
        productId

    );

  }


  // =========================================================
  // COMMIT
  // =========================================================

  private commit(
    list: CartItem[]
  ): void {


    this.items.set(list);

    this.saveToStorage(list);

  }


  // =========================================================
  // LOAD FROM LOCAL STORAGE
  // =========================================================

  private loadFromStorage(): CartItem[] {


    try {


      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );


      return raw
        ? JSON.parse(raw) as CartItem[]
        : [];


    }

    catch {


      return [];

    }

  }


  // =========================================================
  // SAVE TO LOCAL STORAGE
  // =========================================================

  private saveToStorage(
    list: CartItem[]
  ): void {


    try {


      localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(list)

      );


    }

    catch {


      // Storage unavailable - ignore

    }

  }

}