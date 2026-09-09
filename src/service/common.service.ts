import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../environments/environment';
import { Product } from '../app/core/models/product.model';

export interface CartLine {
  cartItemCode: string;
  quantity: number;
  product: Product;
}

// Matches what LoginComponent saves under the "customer" key after login.
// Extra optional name fields added so we can show a name in the navbar
// regardless of which casing your login API actually returns.
// Address / GSTIN fields added so Checkout can pre-fill a returning
// customer's saved details straight from M_CUSTOMER_MASTER.
export interface LoggedCustomer {
  Customer_Code: string;
  Customer_Name?: string;
  Full_Name?: string;
  Name?: string;
  Mobile_No?: string;
  Email_Id?: string;
  Billing_Address?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Zipcode?: string;
  GSTIN_Number?: string;
}

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_CHARGE = 49;

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  public baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) { }

  GetAllProducts() {
    return this.http.get(`${this.baseUrl}/api/Product/ItemList`);
  }

  BrandList() {
    return this.http.get(`${this.baseUrl}/api/master/BrandList`);
  }

  CategoryList() {
    return this.http.get(`${this.baseUrl}/api/master/CategoryList`);
  }

  UmoList(){
    return this.http.get(`${this.baseUrl}/api/master/UmoList`)
  }

  // ==================================================================
  // PRODUCT
  // ==================================================================

  SaveProduct(product: any) {
    return this.http.post(`${this.baseUrl}/api/Product/SaveProduct`, product);
  }

  UpdateProduct(product: any) {
    return this.http.post(`${this.baseUrl}/api/Product/UpdateProduct`, product);
  }

  DeleteProduct(Product_Code: string) {
    return this.http.get(`${this.baseUrl}/api/Product/DeleteProduct`, {
      params: { Product_Code }
    });
  }

  StockList(Product_Code?: string) {
    return this.http.get(`${this.baseUrl}/api/Product/StockList`, {
      params: Product_Code ? { Product_Code } : {}
    });
  }

  SaveStock(stock: any) {
    return this.http.post(`${this.baseUrl}/api/Product/SaveStock`, stock);
  }

  SaveProductPrice(price: any) {
    return this.http.post(`${this.baseUrl}/api/Product/SaveProductPrice`, price);
  }

  WarrantyList() {
    return this.http.get(`${this.baseUrl}/api/Product/WarrantyList`);
  }

  ColorList() {
    return this.http.get(`${this.baseUrl}/api/Product/ColorList`);
  }

  ReorderLevelList() {
    return this.http.get(`${this.baseUrl}/api/Product/ReorderLevelList`);
  }

  TaxList() {
    return this.http.get(`${this.baseUrl}/api/Product/TaxList`);
  }

  UomList2() {
    return this.http.get(`${this.baseUrl}/api/Product/UomList`);
  }

  // ==================================================================
  // CUSTOMER
  // ==================================================================

  CustomerList() {
    return this.http.get(`${this.baseUrl}/api/customer/CustomerList`);
  }

  GetCustomerByCode(Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/customer/GetCustomerByCode`, {
      params: { Customer_Code }
    });
  }

  SaveCustomer(customer: any) {
    return this.http.post(`${this.baseUrl}/api/customer/SaveCustomer`, customer);
  }

  UpdateCustomer(customer: any) {
    return this.http.post(`${this.baseUrl}/api/customer/UpdateCustomer`, customer);
  }

  // ---- Address (billing/shipping/GSTIN) ----
  // Called from Checkout right after an order is placed, so the NEXT
  // GetCustomerByCode already has the saved address ready to pre-fill.
  SaveCustomerAddress(payload: {
    Customer_Code: string;
    Customer_Name?: string;
    Mobile_No?: string;
    Alternate_Phone?: string;
    Landmark?: string;
    Billing_Address: string;
    Billing_City: string;
    Billing_State: string;
    Billing_Zipcode: string;
    Shipping_Address?: string;
    Shipping_City?: string;
    Shipping_State?: string;
    Shipping_Zipcode?: string;
    GSTIN_Number?: string;
    Updated_By?: string;
  }) {
    return this.http.post(`${this.baseUrl}/api/customer/SaveCustomerAddress`, payload);
  }

  LoginCustomer(credentials: { Mobile_No: string; app_password: string }) {
    return this.http.post(`${this.baseUrl}/api/customer/LoginCustomer`, credentials);
  }

  DeleteCustomer(Customer_Code: string, Updated_By?: string) {
    return this.http.get(`${this.baseUrl}/api/customer/DeleteCustomer`, {
      params: Updated_By ? { Customer_Code, Updated_By } : { Customer_Code }
    });
  }

  // ---- Customer Reviews ----

  GetCustomerReviewList() {
    return this.http.get(`${this.baseUrl}/api/customer/Get_CustomerReviewList`);
  }

  GetCustomerReviewByCode(Review_Code: string) {
    return this.http.get(`${this.baseUrl}/api/customer/Get_CustomerReviewByCode`, {
      params: { Review_Code }
    });
  }

  SaveCustomerReview(review: any) {
    return this.http.post(`${this.baseUrl}/api/customer/SaveCustomerReview`, review);
  }

  UpdateCustomerReview(review: any) {
    return this.http.post(`${this.baseUrl}/api/customer/UpdateCustomerReview`, review);
  }

  DeleteCustomerReview(Review_Code: string, Customer_Code?: string, Updated_By?: string) {
    const params: any = { Review_Code };
    if (Customer_Code) params.Customer_Code = Customer_Code;
    if (Updated_By) params.Updated_By = Updated_By;

    return this.http.get(`${this.baseUrl}/api/customer/DeleteCustomerReview`, { params });
  }

  // ==================================================================
  // LOGIN / LOGGED-IN CUSTOMER STATE
  // (reads the same "customer" localStorage key LoginComponent writes to)
  // ==================================================================

  private _loggedCustomer = signal<LoggedCustomer | null>(this.getStoredCustomer());

  loggedCustomer = this._loggedCustomer.asReadonly();

  isLoggedIn = computed(() => !!this._loggedCustomer()?.Customer_Code);

  // Falls back through common name field casings, then mobile no,
  // then a generic label — so navbar always has *something* to show.
  customerDisplayName = computed(() => {
    const c = this._loggedCustomer();
    if (!c) return '';
    return (
      c.Customer_Name ||
      c.Full_Name ||
      c.Name ||
      c.Mobile_No ||
      'My Account'
    ).toString().trim();
  });

  // Call this right after login succeeds (in LoginComponent, after you
  // save "customer" to localStorage) OR on navbar init, so the navbar
  // picks up the freshly logged-in user without a full page reload.
  refreshLoggedCustomer(): void {
    this._loggedCustomer.set(this.getStoredCustomer());
  }

  logout(): void {
    localStorage.removeItem('customer');
    this._loggedCustomer.set(null);
    this._cartItems.set([]);
  }

  // ==================================================================
  // CART — raw API calls
  // ==================================================================

  CartList(Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/cart/CartList`, {
      params: { Customer_Code }
    });
  }

  AddToCart(item: {
    Customer_Code: string;
    Product_Code: string;
    Qty: number;
  }) {
    return this.http.post(`${this.baseUrl}/api/cart/AddToCart`, item);
  }

  IncrementCartQty(Cart_Item_Code: string, Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/cart/IncrementCartQty`, {
      params: { Cart_Item_Code, Customer_Code }
    });
  }

  DecrementCartQty(Cart_Item_Code: string, Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/cart/DecrementCartQty`, {
      params: { Cart_Item_Code, Customer_Code }
    });
  }

  UpdateCartQty(payload: {
    Cart_Item_Code: string;
    Customer_Code: string;
    Product_Code: string;
    Qty: number;
  }) {
    return this.http.post(`${this.baseUrl}/api/cart/UpdateCartQty`, null, {
      params: payload as any
    });
  }

  RemoveFromCart(Cart_Item_Code: string, Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/cart/RemoveFromCart`, {
      params: { Cart_Item_Code, Customer_Code }
    });
  }

  ClearCart(Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/cart/ClearCart`, {
      params: { Customer_Code }
    });
  }

  // ==================================================================
  // CART — state (single source of truth used by BOTH navbar and cart page)
  // ==================================================================

  private _cartItems = signal<CartLine[]>([]);
  private _cartLoading = signal(false);

  cartItems = this._cartItems.asReadonly();
  cartLoading = this._cartLoading.asReadonly();

  totalCount = computed(() =>
    this._cartItems().reduce((sum, line) => sum + line.quantity, 0)
  );

  subTotal = computed(() =>
    this._cartItems().reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  );

  shipping = computed(() =>
    this.subTotal() === 0 || this.subTotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
  );

  grandTotal = computed(() => this.subTotal() + this.shipping());

  private getStoredCustomer(): LoggedCustomer | null {
    try {
      const raw = localStorage.getItem('customer');
      return raw ? JSON.parse(raw) as LoggedCustomer : null;
    } catch {
      return null;
    }
  }

  private customerCode(): string {
    return this.getStoredCustomer()?.Customer_Code?.trim() || '';
  }

  loadCart(): void {
    const customerCode = this.customerCode();

    if (!customerCode) {
      this._cartItems.set([]);
      return;
    }

    this._cartLoading.set(true);

    forkJoin([
      this.CartList(customerCode),
      this.GetAllProducts()
    ]).subscribe({
      next: ([cartRes, productsRes]: [any, any]) => {

        const productMap = new Map<string, any>();

        if (productsRes?.status === true && Array.isArray(productsRes.data)) {
          productsRes.data.forEach((p: any) => productMap.set(String(p.Product_Code), p));
        }

        if (cartRes?.status === true && Array.isArray(cartRes.data)) {

          const lines: CartLine[] = cartRes.data.map((row: any) => {
            const full = productMap.get(String(row.Product_Code));

            const product: Product = {
              id: row.Product_Code,
              productCode: row.Product_Code,
              name: row.Product_Name || full?.Product_Name || full?.Online_Display_Name || '',
              description: full?.Description || full?.Spec_Details || '',
              brand: full?.Brand_Name || '',
              category: full?.Category_Name || '',
              price: Number(row.Selling_Price ?? full?.Selling_Price) || 0,
              mrp: Number(row.Mrp_Price ?? full?.Mrp_Price) || 0,
              costPrice: Number(full?.Cost_Price) || 0,
              gst: Number(full?.Gst_Per) || 0,
              stock: Number(full?.CurrentStock) || 0,
              sku: full?.SKU || '',
              barcode: full?.Barcode || '',
              modelNo: full?.Model_No || '',
              color: full?.Color_Name || '',
              warranty: full?.Warranty_Name || full?.Warranty_Period || '',
              image: row.ProdImgUrl || full?.Product_Image || '',
              isActive: true,
              rating: Number(full?.Star_Rating) || 0,
              reviews: 0,
              specs: [],
              tag: undefined,
              apiData: full
            } as Product;

            return {
              cartItemCode: row.Cart_Item_Code,
              quantity: Number(row.Qty) || 1,
              product
            };
          });

          this._cartItems.set(lines);
        } else {
          this._cartItems.set([]);
        }

        this._cartLoading.set(false);
      },
      error: (error: any) => {
        console.error('LOAD CART ERROR:', error);
        this._cartItems.set([]);
        this._cartLoading.set(false);
      }
    });
  }

  updateQuantity(productId: string, qty: number): void {
    const line = this._cartItems().find(l => l.product.id === productId);

    if (!line) {
      return;
    }

    if (qty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const previousItems = this._cartItems();

    this._cartItems.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );

    this.UpdateCartQty({
      Cart_Item_Code: line.cartItemCode,
      Customer_Code: this.customerCode(),
      Product_Code: line.product.productCode,
      Qty: qty
    }).subscribe({
      next: (res: any) => {
        if (res?.status !== true) {
          this._cartItems.set(previousItems);
        }
      },
      error: (error: any) => {
        console.error('UPDATE CART QTY ERROR:', error);
        this._cartItems.set(previousItems);
      }
    });
  }

  removeFromCart(productId: string): void {
    const line = this._cartItems().find(l => l.product.id === productId);

    if (!line) {
      return;
    }

    const previousItems = this._cartItems();

    this._cartItems.update(items => items.filter(i => i.product.id !== productId));

    this.RemoveFromCart(
      line.cartItemCode,
      this.customerCode()
    ).subscribe({
      next: (res: any) => {
        if (res?.status !== true) {
          this._cartItems.set(previousItems);
        }
      },
      error: (error: any) => {
        console.error('REMOVE FROM CART ERROR:', error);
        this._cartItems.set(previousItems);
      }
    });
  }

  clearCart(): void {
    const customerCode = this.customerCode();

    if (!customerCode) {
      return;
    }

    this.ClearCart(customerCode).subscribe({
      error: (error: any) => console.error('CLEAR CART ERROR:', error)
    });

    this._cartItems.set([]);
  }

  // ==================================================================
  // WISHLIST
  // ==================================================================

  Get_WishlistList(Customer_Code: string) {
    return this.http.get(`${this.baseUrl}/api/wishlist/WishlistList`, {
      params: { Customer_Code }
    });
  }

  WishlistRawList(Customer_Code: string, Company_Code: string, Branch_Code: string) {
    return this.http.get(`${this.baseUrl}/api/wishlist/list`, {
      params: { Customer_Code, Company_Code, Branch_Code }
    });
  }

  SaveWishlist(item: {
    Customer_Code: string;
    Product_Code: string;
    Company_Code: string;
    Branch_Code: string;
  }) {
    return this.http.post(`${this.baseUrl}/api/wishlist/save`, item);
  }

  UpdateWishlist(Wishlist_Code: string, item: {
    Customer_Code: string;
    Product_Code: string;
    Company_Code: string;
    Branch_Code: string;
  }) {
    return this.http.post(`${this.baseUrl}/api/wishlist/update/${Wishlist_Code}`, item);
  }

  DeleteWishlist(Wishlist_Code: string, Customer_Code: string, Company_Code: string, Branch_Code: string) {
    return this.http.get(`${this.baseUrl}/api/wishlist/Delete/${Wishlist_Code}`, {
      params: { Customer_Code, Company_Code, Branch_Code }
    });
  }

  ToggleWishlist(item: {
    Customer_Code: string;
    Product_Code: string;
    Company_Code: string;
    Branch_Code: string;
  }) {
    return this.http.post(`${this.baseUrl}/api/wishlist/ToggleWishlist`, item);
  }




  // ---- ADD TO CART ----
  // Call this from wherever your "Add to Cart" button / popup component
  // lives, instead of calling this.commonService.AddToCart(...) directly.
  // This updates the local signal INSTANTLY (like wishlist), so the
  // navbar badge count changes the moment you click, without waiting
  // for a page navigation. onSuccess/onError callbacks let the caller
  // show its own toast message.

  addToCart(
    product: Product,
    qty: number = 1,
    onSuccess?: () => void,
    onError?: (message?: string) => void
  ): void {

    const customerCode = this.customerCode();

    if (!customerCode) {
      onError?.('Please login to add products to cart.');
      return;
    }

    const existingLine = this._cartItems().find(l => l.product.id === product.id);

    // Already in cart -> just bump the quantity (reuses updateQuantity,
    // which is already optimistic + has rollback on failure)
    if (existingLine) {
      this.updateQuantity(product.id, existingLine.quantity + qty);
      onSuccess?.();
      return;
    }

    const previousItems = this._cartItems();

    // Optimistic local add — temp cart item code until server responds
    const tempLine: CartLine = {
      cartItemCode: 'temp-' + product.id,
      quantity: qty,
      product
    };

    this._cartItems.update(items => [...items, tempLine]);

    this.AddToCart({
      Customer_Code: customerCode,
      Product_Code: product.productCode,
      Qty: qty
    }).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          // Refresh from server so we get the REAL Cart_Item_Code
          // (needed later for increment/decrement/remove to work)
          this.loadCart();
          onSuccess?.();
        } else {
          // backend rejected it -> roll back
          this._cartItems.set(previousItems);
          onError?.(res?.message);
        }
      },
      error: (error: any) => {
        console.error('ADD TO CART ERROR:', error);
        this._cartItems.set(previousItems);
        onError?.(error?.error?.message);
      }
    });

  }


  GetBannerList() {
  return this.http.get(`${this.baseUrl}/api/HomePageBanner/BannerList`);
}
 
// ---------------------------------------------------------------
// ADVERTISEMENT  (ad slots on the home page)
// ---------------------------------------------------------------
 
GetAdvertisementList() {
  return this.http.get(`${this.baseUrl}/api/Advertisement/AdvertisementList`);
}

// Single slot only (Products / Product-Details / Cart pages use this —
// server already filters to active ads within Start_Date/End_Date).
GetAdvertisementListBySlot(slotNo: number) {
  return this.http.get(`${this.baseUrl}/api/Advertisement/AdvertisementListBySlot?Slot_No=${slotNo}`);
}
 

  SubmitContactEnquiry(payload: {
    Customer_Code?: string | null;
    Full_Name: string;
    Email_Id: string;
    Mobile_No?: string | null;
    Subject: string;
    Message: string;
  }) {
    return this.http.post(`${this.baseUrl}/api/ContactUs/Submit`, payload);
  }

}