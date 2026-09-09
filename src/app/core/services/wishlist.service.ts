import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

interface LoggedCustomer {
  Customer_Code: string;
}

interface WishlistRow {
  Wishlist_Code: string;
  Customer_Code: string;
  Product_Code: string;
  Is_Active: string;
  Created_On?: string;
  Updated_On?: string;
  Company_Code?: string;
  Branch_Code?: string;

  // Product fields returned by WishlistList
  Product_Name?: string;
  Selling_Price?: number | string;
  Mrp_Price?: number | string;
  ProdImgUrl?: string;
  Product_Image?: string;
  Image_Url?: string;
  Category_Name?: string;
  Category?: string;
  Brand_Name?: string;
  Brand?: string;
  Description?: string;
  Product_Description?: string;
  Rating?: number | string;
  Reviews?: number | string;
  Stock?: number | string;
  CurrentStock?: number | string;

  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  public baseUrl = environment.apiUrl;

  // =========================================================
  // WISHLIST PRODUCTS
  // =========================================================

  private readonly items = signal<Product[]>([]);

  /**
   * Product_Code -> Wishlist_Code
   */
  private wishlistCodes = new Map<string, string>();

  readonly loading = signal(false);

  readonly wishlistItems = computed(() => this.items());

  readonly totalCount = computed(() => this.items().length);


  constructor(private http: HttpClient) {
    this.loadFromServer();
  }


  // =========================================================
  // CHECK WISHLIST
  // =========================================================

  isWishlisted(productId: string): boolean {

    const code = String(productId || '').trim();

    if (!code) {
      return false;
    }

    return this.items().some(
      product =>
        String(
          product.productCode ||
          product.id ||
          ''
        ).trim() === code
    );
  }


  // =========================================================
  // TOGGLE WISHLIST
  //
  // IMPORTANT:
  // Existing Product_Code is always sent.
  // No new Product_Code is generated here.
  //
  // Heart click = only action that changes Is_Active.
  // =========================================================

  toggle(product: Product): void {

    const customerCode = this.customerCode();

    if (!customerCode) {
      return;
    }

    const productCode = String(
      product?.productCode ||
      product?.id ||
      ''
    ).trim();

    if (!productCode) {
      console.error(
        'WISHLIST: Product_Code not found.',
        product
      );
      return;
    }

    const exists = this.isWishlisted(productCode);

    const previousItems = [...this.items()];
    const previousCodes = new Map(this.wishlistCodes);

    const { Company_Code, Branch_Code } = this.companyBranch();


    // =======================================================
    // OPTIMISTIC UI UPDATE
    // =======================================================

    if (exists) {

      // Heart clicked -> remove from visible wishlist
      this.items.set(
        this.items().filter(
          item =>
            String(
              item.productCode ||
              item.id ||
              ''
            ).trim() !== productCode
        )
      );

      this.wishlistCodes.delete(productCode);

    } else {

      // Add existing product object.
      // Product_Code remains unchanged.
      this.items.set([
        ...this.items(),
        product
      ]);
    }


    // =======================================================
    // BACKEND
    // =======================================================

    this.http.post(
      `${this.baseUrl}/api/wishlist/ToggleWishlist`,
      {
        Customer_Code: customerCode,

        // IMPORTANT:
        // Existing Product_Code only.
        Product_Code: productCode,

        Company_Code,
        Branch_Code
      }
    ).subscribe({

      next: (res: any) => {

        if (res?.status !== true) {

          // Rollback
          this.items.set(previousItems);
          this.wishlistCodes = previousCodes;

          return;
        }


        // ===================================================
        // RESPONSE WISHLIST CODE
        // ===================================================

        const responseItem =
          res?.data?.Item?.[0] ??
          res?.data?.[0] ??
          null;


        if (responseItem?.Wishlist_Code) {

          this.wishlistCodes.set(
            productCode,
            String(responseItem.Wishlist_Code)
          );
        }


        // ===================================================
        // IMPORTANT
        //
        // If heart was clicked for removal, backend should
        // have changed Is_Active from A -> D.
        //
        // We do NOT generate another product code.
        // ===================================================

      },

      error: (error: any) => {

        console.error(
          'TOGGLE WISHLIST ERROR:',
          error
        );

        // Rollback UI if API fails
        this.items.set(previousItems);
        this.wishlistCodes = previousCodes;
      }

    });
  }


  // =========================================================
  // REMOVE FROM WISHLIST
  //
  // This is called ONLY when heart button is clicked.
  //
  // We use ToggleWishlist so backend can change:
  //
  // A -> D
  //
  // instead of deleting the row.
  // =========================================================

  remove(productId: string): void {

    const customerCode = this.customerCode();

    const code = String(productId || '').trim();

    if (!customerCode || !code) {
      return;
    }

    const previousItems = [...this.items()];
    const previousCodes = new Map(this.wishlistCodes);

    const { Company_Code, Branch_Code } =
      this.companyBranch();


    // =======================================================
    // REMOVE FROM UI IMMEDIATELY
    // =======================================================

    this.items.set(
      this.items().filter(
        item =>
          String(
            item.productCode ||
            item.id ||
            ''
          ).trim() !== code
      )
    );

    this.wishlistCodes.delete(code);


    // =======================================================
    // CHANGE Is_Active -> D
    // =======================================================

    this.http.post(
      `${this.baseUrl}/api/wishlist/ToggleWishlist`,
      {
        Customer_Code: customerCode,
        Product_Code: code,
        Company_Code,
        Branch_Code
      }
    ).subscribe({

      next: (res: any) => {

        if (res?.status !== true) {

          console.error(
            'REMOVE WISHLIST FAILED:',
            res
          );

          // Rollback
          this.items.set(previousItems);
          this.wishlistCodes = previousCodes;
        }

      },

      error: (error: any) => {

        console.error(
          'REMOVE WISHLIST ERROR:',
          error
        );

        // Rollback
        this.items.set(previousItems);
        this.wishlistCodes = previousCodes;
      }

    });
  }


  // =========================================================
  // LOAD WISHLIST FROM SERVER
  //
  // IMPORTANT:
  // 1. Load active wishlist rows
  // 2. Load complete product master
  // 3. Merge using Product_Code
  //
  // This fixes refresh issue.
  // =========================================================

  loadFromServer(): void {

    const customerCode = this.customerCode();

    if (!customerCode) {

      this.items.set([]);
      this.wishlistCodes.clear();

      return;
    }


    this.loading.set(true);

    const {
      Company_Code,
      Branch_Code
    } = this.companyBranch();


    // =======================================================
    // LOAD WISHLIST + PRODUCT MASTER
    // =======================================================

    this.http.get(
      `${this.baseUrl}/api/wishlist/WishlistList`,
      {
        params: {
          Customer_Code: customerCode,
          Company_Code,
          Branch_Code
        }
      }
    ).subscribe({

      next: (wishlistRes: any) => {

        const wishlistRows =
          this.extractArray(
            wishlistRes
          );


        // ===================================================
        // ONLY ACTIVE WISHLIST
        //
        // A = Active
        // D = Deactivated
        // ===================================================

        const activeRows: WishlistRow[] =
          wishlistRows.filter(
            (row: WishlistRow) =>
              String(
                row?.Is_Active ??
                row?.is_Active ??
                row?.Status ??
                'A'
              )
                .trim()
                .toUpperCase() === 'A'
          );


        // No active wishlist
        if (activeRows.length === 0) {

          this.items.set([]);
          this.wishlistCodes.clear();
          this.loading.set(false);

          return;
        }


        // ===================================================
        // SAVE WISHLIST CODES
        // ===================================================

        this.wishlistCodes.clear();

        activeRows.forEach(
          (row: WishlistRow) => {

            const productCode =
              String(
                row.Product_Code || ''
              ).trim();

            const wishlistCode =
              String(
                row.Wishlist_Code || ''
              ).trim();

            if (
              productCode &&
              wishlistCode
            ) {

              this.wishlistCodes.set(
                productCode,
                wishlistCode
              );
            }
          }
        );


        // ===================================================
        // NOW LOAD COMPLETE PRODUCT MASTER
        // ===================================================

        this.loadProductDetails(
          activeRows
        );

      },

      error: (error: any) => {

        console.error(
          'LOAD WISHLIST ERROR:',
          error
        );

        this.items.set([]);
        this.wishlistCodes.clear();
        this.loading.set(false);
      }

    });
  }


  // =========================================================
  // LOAD COMPLETE PRODUCT DATA
  //
  // Existing product codes are matched with wishlist codes.
  // =========================================================

  private loadProductDetails(
    wishlistRows: WishlistRow[]
  ): void {

    const {
      Company_Code,
      Branch_Code
    } = this.companyBranch();


    this.http.get(
      `${this.baseUrl}/api/Product/ItemList`,
      {
        params: {
          Company_Code,
          Branch_Code
        }
      }
    ).subscribe({

      next: (productRes: any) => {

        const productRows =
          this.extractArray(
            productRes
          );


        // ===================================================
        // PRODUCT MASTER MAP
        //
        // Product_Code -> Product
        // ===================================================

        const productMap =
          new Map<string, any>();


        productRows.forEach(
          (row: any) => {

            const code = String(
              row?.Product_Code ??
              row?.productCode ??
              row?.id ??
              ''
            ).trim();

            if (code) {
              productMap.set(
                code,
                row
              );
            }
          }
        );


        // ===================================================
        // BUILD FINAL WISHLIST PRODUCT LIST
        // ===================================================

        const finalProducts: Product[] = [];


        wishlistRows.forEach(
          (wishlistRow: WishlistRow) => {

            const productCode =
              String(
                wishlistRow.Product_Code || ''
              ).trim();

            if (!productCode) {
              return;
            }


            // Full product master row
            const productRow =
              productMap.get(productCode);


            // Merge:
            // Product master first,
            // Wishlist data as fallback.
            const merged =
              this.mergeProductData(
                productRow,
                wishlistRow
              );


            const product =
              this.mapToProduct(
                merged,
                productCode,
                wishlistRow
              );


            if (product) {
              finalProducts.push(product);
            }

          }
        );


        // ===================================================
        // SET FINAL LIST
        // ===================================================

        this.items.set(
          finalProducts
        );

        this.loading.set(false);

      },

      error: (error: any) => {

        console.error(
          'LOAD PRODUCT DETAILS ERROR:',
          error
        );


        // ===================================================
        // FALLBACK
        //
        // Even if product API fails, show whatever product
        // details are available from WishlistList.
        // ===================================================

        const fallbackProducts =
          wishlistRows
            .map(
              (row: WishlistRow) =>
                this.mapToProduct(
                  row,
                  String(
                    row.Product_Code || ''
                  ).trim(),
                  row
                )
            )
            .filter(
              (
                product: Product | null
              ): product is Product =>
                product !== null
            );


        this.items.set(
          fallbackProducts
        );

        this.loading.set(false);
      }

    });
  }


  // =========================================================
  // MERGE PRODUCT + WISHLIST
  // =========================================================

  private mergeProductData(
    productRow: any,
    wishlistRow: WishlistRow
  ): any {

    return {

      ...(productRow || {}),

      ...(wishlistRow || {})

    };
  }


  // =========================================================
  // MAP API DATA -> Product MODEL
  // =========================================================

  private mapToProduct(
    row: any,
    productCode: string,
    wishlistRow?: WishlistRow
  ): Product | null {

    if (!productCode) {
      return null;
    }


    const name =
      this.firstString(
        row?.Product_Name,
        row?.product_name,
        row?.Name,
        wishlistRow?.Product_Name,
        'Unnamed Product'
      );


    const sellingPrice =
      this.firstNumber(
        row?.Selling_Price,
        row?.selling_price,
        row?.Price,
        wishlistRow?.Selling_Price
      );


    const mrp =
      this.firstNumber(
        row?.Mrp_Price,
        row?.MRP_Price,
        row?.mrp_price,
        row?.MRP,
        wishlistRow?.Mrp_Price
      );


    const image =
      this.firstString(
        row?.ProdImgUrl,
        row?.Product_Image,
        row?.Image_Url,
        row?.Image,
        row?.ImageUrl,
        wishlistRow?.ProdImgUrl,
        wishlistRow?.Product_Image,
        wishlistRow?.Image_Url,
        ''
      );


    const category =
      this.firstString(
        row?.Category_Name,
        row?.Category,
        row?.category_name,
        wishlistRow?.Category_Name,
        wishlistRow?.Category,
        ''
      );


    const brand =
      this.firstString(
        row?.Brand_Name,
        row?.Brand,
        row?.brand_name,
        wishlistRow?.Brand_Name,
        wishlistRow?.Brand,
        ''
      );


    const description =
      this.firstString(
        row?.Product_Description,
        row?.Description,
        row?.Product_Details,
        row?.Short_Description,
        wishlistRow?.Product_Description,
        wishlistRow?.Description,
        ''
      );


    const rating =
      this.firstNumber(
        row?.Rating,
        row?.Product_Rating,
        row?.Average_Rating,
        wishlistRow?.Rating
      );


    const reviews =
      this.firstNumber(
        row?.Reviews,
        row?.Review_Count,
        row?.Total_Reviews,
        wishlistRow?.Reviews
      );


    const stock =
      this.firstNumber(
        row?.CurrentStock,
        row?.Current_Stock,
        row?.Stock,
        row?.Available_Stock,
        wishlistRow?.CurrentStock,
        wishlistRow?.Stock
      );


    const sku =
      this.firstString(
        row?.SKU,
        row?.Sku,
        row?.sku,
        ''
      );


    const barcode =
      this.firstString(
        row?.Barcode,
        row?.BARCODE,
        ''
      );


    const modelNo =
      this.firstString(
        row?.Model_No,
        row?.ModelNo,
        row?.Model_Number,
        ''
      );


    const color =
      this.firstString(
        row?.Color,
        row?.Colour,
        ''
      );


    const warranty =
      this.firstString(
        row?.Warranty,
        row?.Warranty_Period,
        ''
      );


    return {

      // =====================================================
      // IMPORTANT:
      // Existing Product_Code is preserved.
      // =====================================================

      id: productCode,

      productCode: productCode,

      name: name,

      description: description,

      brand: brand,

      category: category,

      price: sellingPrice,

      mrp: mrp,

      costPrice:
        this.firstNumber(
          row?.Cost_Price,
          row?.cost_price,
          0
        ),

      gst:
        this.firstNumber(
          row?.GST,
          row?.Gst,
          0
        ),

      stock: stock,

      sku: sku,

      barcode: barcode,

      modelNo: modelNo,

      color: color,

      warranty: warranty,

      image: image,

      isActive: true,

      rating: rating,

      reviews: reviews,

      specs: [],

      tag: undefined,

      // Keep complete backend response
      apiData: {

        ...row,

        Wishlist_Code:
          wishlistRow?.Wishlist_Code,

        Product_Code:
          productCode,

        Is_Active:
          wishlistRow?.Is_Active || 'A'

      }

    } as Product;
  }


  // =========================================================
  // RESPONSE ARRAY NORMALIZER
  // =========================================================

  private extractArray(
    response: any
  ): any[] {

    if (Array.isArray(response)) {
      return response;
    }


    if (
      Array.isArray(
        response?.data
      )
    ) {

      return response.data;
    }


    if (
      Array.isArray(
        response?.data?.Item
      )
    ) {

      return response.data.Item;
    }


    if (
      Array.isArray(
        response?.data?.items
      )
    ) {

      return response.data.items;
    }


    if (
      Array.isArray(
        response?.Item
      )
    ) {

      return response.Item;
    }


    if (
      Array.isArray(
        response?.items
      )
    ) {

      return response.items;
    }


    return [];
  }


  // =========================================================
  // STRING HELPER
  // =========================================================

  private firstString(
    ...values: any[]
  ): string {

    for (const value of values) {

      if (
        value !== null &&
        value !== undefined
      ) {

        const text =
          String(value).trim();

        if (text) {
          return text;
        }
      }
    }

    return '';
  }


  // =========================================================
  // NUMBER HELPER
  // =========================================================

  private firstNumber(
    ...values: any[]
  ): number {

    for (const value of values) {

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {

        const number =
          Number(value);

        if (
          Number.isFinite(number)
        ) {

          return number;
        }
      }
    }

    return 0;
  }


  // =========================================================
  // CUSTOMER
  // =========================================================

  private customerCode(): string {

    try {

      const raw =
        localStorage.getItem(
          'customer'
        );

      const customer =
        raw
          ? JSON.parse(raw) as LoggedCustomer
          : null;

      return (
        customer?.Customer_Code
          ?.trim() || ''
      );

    } catch {

      return '';
    }
  }


  // =========================================================
  // COMPANY + BRANCH
  // =========================================================

  private companyBranch(): {
    Company_Code: string;
    Branch_Code: string;
  } {

    return {

      Company_Code:
        localStorage.getItem(
          'Company_Code'
        ) || '',

      Branch_Code:
        localStorage.getItem(
          'Branch_Code'
        ) || ''

    };
  }

}