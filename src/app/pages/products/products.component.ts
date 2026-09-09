import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';

import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { CommonService } from '../../../service/common.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { AdBannerComponent } from '../../shared/components/ad-banner/ad-banner.component';

@Component({
  selector: 'app-products',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    RouterModule,
    AdBannerComponent
  ],

  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit, OnDestroy {

  // =========================================================
  // PRODUCTS
  // =========================================================

  allProducts: Product[] = [];

  results: Product[] = [];


  // =========================================================
  // FILTERS
  // =========================================================

  allCategories: string[] = [];

  allBrands: string[] = [];

  selectedCategories: string[] = [];

  selectedBrands: string[] = [];

  readonly filterPreviewCount = 4;

  showAllCategories = false;

  showAllBrands = false;


  // =========================================================
  // TOP CATEGORY
  // =========================================================

  topCategoryFilter: string | null = null;


  // =========================================================
  // SEARCH
  // =========================================================

  searchTerm = '';


  // =========================================================
  // PRICE
  // =========================================================

  minPriceLimit = 500;

  maxPriceLimit = 50000;

  maxPrice = 50000;


  // =========================================================
  // RATING
  // =========================================================

  minRating: number | null = null;

  ratingOptions: number[] = [
    4.5,
    4,
    3.5,
    3,
    2
  ];


  // =========================================================
  // SORT
  // =========================================================

  sortBy = '';

  sortOptions = [
    {
      value: '',
      label: 'Recommended'
    },
    {
      value: 'price-asc',
      label: 'Price: Low to High'
    },
    {
      value: 'price-desc',
      label: 'Price: High to Low'
    },
    {
      value: 'rating',
      label: 'Highest Rated'
    },
    {
      value: 'newest',
      label: 'Newest First'
    }
  ];


  // =========================================================
  // LOADING
  // =========================================================

  loading = true;


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  productImageError: {
    [key: string]: boolean
  } = {};


  // =========================================================
  // QUICK VIEW
  // =========================================================

  quickViewOpen = false;

  selectedProduct: Product | null = null;

  quickViewQuantity = 1;

  quickViewImageError = false;


  // =========================================================
  // ACCORDION
  // =========================================================

  openSections: {
    [key: string]: boolean
  } = {

    category: true,

    brand: true,

    price: true,

    rating: true,

    youMayLike: false

  };


  // =========================================================
  // ⭐ MOBILE / TABLET — FILTERS & SORT DRAWERS
  // =========================================================

  mobileFiltersOpen = false;

  mobileSortOpen = false;


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

    private productService: ProductService,

    private route: ActivatedRoute,

    private router: Router,

    private service: CommonService,

    private wishlistService: WishlistService

  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.getall();


    this.route.queryParamMap.subscribe(params => {

      const category = params.get('category');

      const brand = params.get('brand');

      const q = params.get('q');

      const sort = params.get('sort');


      if (category) {

        this.selectedCategories = [
          category
        ];

      }


      if (brand) {

        this.selectedBrands = [
          brand
        ];

      }


      if (q) {

        this.searchTerm = q;

      }


      if (sort) {

        this.sortBy = sort;

      }


      if (
        category ||
        brand ||
        q ||
        sort
      ) {

        setTimeout(() => {

          this.applyFilters();

        });

      }

    });

  }


  // =========================================================
  // GET PRODUCTS
  // =========================================================

  getall(): void {

    this.loading = true;


    this.service.GetAllProducts().subscribe({

      next: (res: any) => {

        if (
          res?.status === true &&
          Array.isArray(res?.data)
        ) {

          const products: Product[] =
            res.data.map(
              (item: any) => {

                const product: any = {

                  id:
                    item.U_Id ??
                    item.ProductId ??
                    item.Product_Code ??
                    '',


                  productCode:
                    item.Product_Code ??
                    '',


                  name:
                    item.Product_Name ||
                    item.Online_Display_Name ||
                    item.Print_Name ||
                    '',


                  shortName:
                    item.Product_Short_Name ??
                    '',


                  category:
                    item.Category_Name ??
                    '',


                  brand:
                    item.Brand_Name ??
                    '',


                  description:
                    item.Description ??
                    '',


                  price:
                    Number(
                      item.Selling_Price
                    ) || 0,


                  mrp:
                    Number(
                      item.Mrp_Price
                    ) || 0,


                  costPrice:
                    Number(
                      item.Cost_Price
                    ) || 0,


                  gst:
                    Number(
                      item.Gst ??
                      item.Gst_Per
                    ) || 0,


                  stock:
                    Number(
                      item.CurrentStock
                    ) || 0,


                  sku:
                    item.SKU ??
                    '',


                  barcode:
                    item.Barcode ??
                    '',


                  modelNo:
                    item.Model_No ??
                    '',


                  color:
                    item.Color_Name ??
                    '',


                  warranty:
                    item.Warranty_Name ||
                    item.Warranty_Period ||
                    '',


                  image:
                    item.ProdImgUrl ||
                    item.Product_Image ||
                    item.Image_Path ||
                    '',


                  rating:
                    Number(
                      item.Star_Rating ??
                      item.Rating ??
                      item.AverageRating ??
                      0
                    ) || 0,


                  isActive:
                    item.Is_Active === 'A',


                  apiData:
                    item

                };


                return product as Product;

              }
            );


          this.allProducts = products;

          this.results = [
            ...this.allProducts
          ];


          // =====================================================
          // CATEGORIES
          // =====================================================

          this.allCategories = [

            ...new Set<string>(

              res.data

                .map(
                  (item: any) =>
                    String(
                      item.Category_Name ?? ''
                    ).trim()
                )

                .filter(
                  (value: string) =>
                    value.length > 0
                )

            )

          ];


          // =====================================================
          // BRANDS
          // =====================================================

          this.allBrands = [

            ...new Set<string>(

              res.data

                .map(
                  (item: any) =>
                    String(
                      item.Brand_Name ?? ''
                    ).trim()
                )

                .filter(
                  (value: string) =>
                    value.length > 0
                )

            )

          ];


          if (
            this.searchTerm ||
            this.selectedCategories.length > 0 ||
            this.selectedBrands.length > 0 ||
            this.sortBy
          ) {

            this.applyFilters();

          }

        }
        else {

          this.allProducts = [];

          this.results = [];

        }


        this.loading = false;

      },


      error: (error: any) => {

        console.error(
          'GET ALL PRODUCTS API ERROR:',
          error
        );


        this.allProducts = [];

        this.results = [];

        this.loading = false;

      }

    });

  }


  // =========================================================
  // ⭐ FILTER
  //    STRICT filter: only products matching every active
  //    filter (search/category/brand/price/rating) are shown.
  //    Everything else is hidden — no "show all" fallback.
  // =========================================================

  applyFilters(): void {

    let filteredProducts: any[] = [
      ...this.allProducts
    ];


    const search =
      this.searchTerm
        ?.trim()
        .toLowerCase() || '';


    // SEARCH
    if (search) {

      filteredProducts =
        filteredProducts.filter(
          (product: any) => {

            const name =
              String(
                product.name ?? ''
              ).toLowerCase();


            const category =
              String(
                product.category ?? ''
              ).toLowerCase();


            const brand =
              String(
                product.brand ?? ''
              ).toLowerCase();


            const code =
              String(
                product.productCode ?? ''
              ).toLowerCase();


            const sku =
              String(
                product.sku ?? ''
              ).toLowerCase();


            return (

              name.includes(search) ||

              category.includes(search) ||

              brand.includes(search) ||

              code.includes(search) ||

              sku.includes(search)

            );

          }
        );

    }


    // CATEGORY
    if (
      this.selectedCategories.length > 0
    ) {

      filteredProducts =
        filteredProducts.filter(
          (product: any) => {

            const category =
              String(
                product.category ?? ''
              )
                .trim()
                .toLowerCase();


            return this.selectedCategories.some(
              selected =>

                selected
                  .trim()
                  .toLowerCase() === category

            );

          }
        );

    }


    // BRAND
    if (
      this.selectedBrands.length > 0
    ) {

      filteredProducts =
        filteredProducts.filter(
          (product: any) => {

            const brand =
              String(
                product.brand ?? ''
              )
                .trim()
                .toLowerCase();


            return this.selectedBrands.some(
              selected =>

                selected
                  .trim()
                  .toLowerCase() === brand

            );

          }
        );

    }


    // PRICE
    filteredProducts =
      filteredProducts.filter(
        (product: any) => {

          const price =
            Number(
              product.price ?? 0
            );


          return price <=
            Number(this.maxPrice);

        }
      );


    // RATING
    if (
      this.minRating !== null &&
      this.minRating !== undefined
    ) {

      filteredProducts =
        filteredProducts.filter(
          (product: any) => {

            const rating =
              Number(
                product.rating ?? 0
              );


            return rating >=
              Number(this.minRating);

          }
        );

    }


    // SORT
    switch (this.sortBy) {

      case 'price-asc':

        filteredProducts.sort(
          (a: any, b: any) =>
            Number(a.price || 0) -
            Number(b.price || 0)
        );

        break;


      case 'price-desc':

        filteredProducts.sort(
          (a: any, b: any) =>
            Number(b.price || 0) -
            Number(a.price || 0)
        );

        break;


      case 'rating':

        filteredProducts.sort(
          (a: any, b: any) =>
            Number(b.rating || 0) -
            Number(a.rating || 0)
        );

        break;


      case 'newest':

        filteredProducts.sort(
          (a: any, b: any) => {

            const dateA =
              String(
                a.apiData?.Created_On ?? ''
              );


            const dateB =
              String(
                b.apiData?.Created_On ?? ''
              );


            return dateB.localeCompare(
              dateA
            );

          }
        );

        break;

    }


    this.results =
      filteredProducts as Product[];

  }


  // =========================================================
  // ⭐ APPLY FILTERS FROM MOBILE DRAWER (also closes the drawer)
  // =========================================================

  applyFiltersAndClose(): void {

    this.applyFilters();

    this.mobileFiltersOpen = false;

    this.syncBodyScrollLock();

  }


  // =========================================================
  // TOP CATEGORY
  // =========================================================

  onTopCategoryChange(): void {

    this.selectedCategories =
      this.topCategoryFilter
        ? [this.topCategoryFilter]
        : [];


    this.applyFilters();

  }


  // =========================================================
  // SEARCH
  // =========================================================

  clearSearch(): void {

    this.searchTerm = '';

    this.applyFilters();

  }


  onSearchClear(): void {

    this.clearSearch();

  }


  // =========================================================
  // RESET
  // =========================================================

  resetFilters(): void {

    this.searchTerm = '';

    this.selectedCategories = [];

    this.selectedBrands = [];

    this.topCategoryFilter = null;

    this.minRating = null;

    this.maxPrice =
      this.maxPriceLimit;

    this.sortBy = '';

    this.showAllCategories = false;

    this.showAllBrands = false;


    this.results = [
      ...this.allProducts
    ];

    this.mobileFiltersOpen = false;

    this.syncBodyScrollLock();

  }


  // =========================================================
  // SKELETON
  // =========================================================

  get skeletons(): number[] {

    return Array(8).fill(0);

  }


  // =========================================================
  // ACCORDION
  // =========================================================

  toggleSection(key: string): void {

    this.openSections[key] =
      !this.openSections[key];

  }


  // =========================================================
  // ⭐ MOBILE / TABLET — FILTERS & SORT DRAWER TOGGLES
  // =========================================================

  toggleMobileFilters(): void {

    this.mobileFiltersOpen = !this.mobileFiltersOpen;

    if (this.mobileFiltersOpen) {

      this.mobileSortOpen = false;

    }

    this.syncBodyScrollLock();

  }


  toggleMobileSort(): void {

    this.mobileSortOpen = !this.mobileSortOpen;

    if (this.mobileSortOpen) {

      this.mobileFiltersOpen = false;

    }

    this.syncBodyScrollLock();

  }


  closeMobilePanels(): void {

    this.mobileFiltersOpen = false;

    this.mobileSortOpen = false;

    this.syncBodyScrollLock();

  }


  // =========================================================
  // ⭐ BODY SCROLL LOCK — while the mobile filter/sort drawer
  //    is open, only the drawer itself should scroll; the page
  //    underneath must stay put (no double-scroll behind it).
  // =========================================================

  private syncBodyScrollLock(): void {

    const shouldLock = this.mobileFiltersOpen || this.mobileSortOpen;

    document.body.style.overflow = shouldLock ? 'hidden' : '';

  }


  ngOnDestroy(): void {

    document.body.style.overflow = '';

  }


  selectSort(value: string): void {

    this.sortBy = value;

    this.applyFilters();

    this.mobileSortOpen = false;

  }


  // =========================================================
  // CATEGORY
  // =========================================================

  isCategorySelected(
    cat: string
  ): boolean {

    return this.selectedCategories.includes(
      cat
    );

  }


  toggleCategory(
    cat: string
  ): void {

    const idx =
      this.selectedCategories.indexOf(
        cat
      );


    if (idx > -1) {

      this.selectedCategories =
        this.selectedCategories.filter(
          c => c !== cat
        );

    }
    else {

      this.selectedCategories = [

        ...this.selectedCategories,

        cat

      ];

    }


    this.applyFilters();

  }


  getCategoryCount(
    cat: string
  ): number {

    return this.allProducts.filter(
      (product: any) =>

        String(
          product.category ?? ''
        )
          .trim()
          .toLowerCase() ===
        cat
          .trim()
          .toLowerCase()

    ).length;

  }


  get visibleCategories(): string[] {

    return this.showAllCategories

      ? this.allCategories

      : this.allCategories.slice(
          0,
          this.filterPreviewCount
        );

  }


  get hasMoreCategories(): boolean {

    return (
      this.allCategories.length >
      this.filterPreviewCount
    );

  }


  toggleShowAllCategories(): void {

    this.showAllCategories =
      !this.showAllCategories;

  }


  // =========================================================
  // BRAND
  // =========================================================

  isBrandSelected(
    brand: string
  ): boolean {

    return this.selectedBrands.includes(
      brand
    );

  }


  toggleBrand(
    brand: string
  ): void {

    const idx =
      this.selectedBrands.indexOf(
        brand
      );


    if (idx > -1) {

      this.selectedBrands =
        this.selectedBrands.filter(
          b => b !== brand
        );

    }
    else {

      this.selectedBrands = [

        ...this.selectedBrands,

        brand

      ];

    }


    this.applyFilters();

  }


  getBrandCount(
    brand: string
  ): number {

    return this.allProducts.filter(
      (product: any) =>

        String(
          product.brand ?? ''
        )
          .trim()
          .toLowerCase() ===
        brand
          .trim()
          .toLowerCase()

    ).length;

  }


  get visibleBrands(): string[] {

    return this.showAllBrands

      ? this.allBrands

      : this.allBrands.slice(
          0,
          this.filterPreviewCount
        );

  }


  get hasMoreBrands(): boolean {

    return (
      this.allBrands.length >
      this.filterPreviewCount
    );

  }


  toggleShowAllBrands(): void {

    this.showAllBrands =
      !this.showAllBrands;

  }


  // =========================================================
  // RATING
  // =========================================================

  toggleRating(
    rating: number
  ): void {

    this.minRating =
      this.minRating === rating
        ? null
        : rating;


    this.applyFilters();

  }


  getRatingCount(
    rating: number
  ): number {

    return this.allProducts.filter(
      (product: any) =>

        Number(
          product.rating ?? 0
        ) >= rating

    ).length;

  }


  starsArray(
    count: number
  ): number[] {

    const safeCount =
      Math.max(
        0,
        Math.floor(count)
      );


    return Array(
      safeCount
    ).fill(0);

  }


  // =========================================================
  // ⭐ HALF-STAR RATING HELPERS
  //    3.5 => 3 full yellow stars + 1 half yellow star + 1 empty
  // =========================================================

  private roundToHalf(
    rating: number
  ): number {

    return Math.round(
      rating * 2
    ) / 2;

  }


  getFullStars(
    rating: number
  ): number {

    const safeRating =
      Math.max(
        0,
        Math.min(5, rating || 0)
      );


    const rounded =
      this.roundToHalf(
        safeRating
      );


    return Math.floor(
      rounded
    );

  }


  hasHalfStar(
    rating: number
  ): boolean {

    const safeRating =
      Math.max(
        0,
        Math.min(5, rating || 0)
      );


    const rounded =
      this.roundToHalf(
        safeRating
      );


    return (rounded % 1) !== 0;

  }


  getEmptyStars(
    rating: number
  ): number {

    const full =
      this.getFullStars(
        rating
      );


    const half =
      this.hasHalfStar(
        rating
      )
        ? 1
        : 0;


    return Math.max(
      0,
      5 - full - half
    );

  }


  // =========================================================
  // YOU MAY LIKE
  // =========================================================

  get youMayLikeProducts(): Product[] {

    return [
      ...this.allProducts
    ]

      .sort(
        (a: any, b: any) =>

          Number(b.rating || 0) -
          Number(a.rating || 0)

      )

      .slice(
        0,
        4
      );

  }


  // =========================================================
  // PRODUCT HELPERS
  // =========================================================

  getProductName(
    product: any
  ): string {

    return String(

      product?.name ??

      product?.Product_Name ??

      product?.ProductName ??

      'Unnamed Product'

    );

  }


  getProductImage(
    product: any
  ): string {

    return (

      product?.image ||

      product?.ProdImgUrl ||

      product?.Product_Image ||

      product?.Image_Path ||

      ''

    );

  }


  getProductPrice(
    product: any
  ): number {

    return Number(

      product?.price ??

      product?.Selling_Price ??

      product?.SellingPrice ??

      0

    ) || 0;

  }


  getProductCategory(
    product: any
  ): string {

    return String(

      product?.category ??

      product?.Category_Name ??

      ''

    );

  }


  getProductBrand(
    product: any
  ): string {

    return String(

      product?.brand ??

      product?.Brand_Name ??

      ''

    );

  }


  getProductRating(
    product: any
  ): number {

    return Number(

      product?.rating ??

      product?.Star_Rating ??

      product?.Rating ??

      product?.AverageRating ??

      0

    ) || 0;

  }


  getCategory(
    product: any
  ): string {

    return this.getProductCategory(
      product
    );

  }


  getBrand(
    product: any
  ): string {

    return this.getProductBrand(
      product
    );

  }


  getRating(
    product: any
  ): number {

    return this.getProductRating(
      product
    );

  }


  getProductDescription(
    product: any
  ): string {

    return String(

      product?.description ??

      product?.Description ??

      ''

    );

  }


  getShortDescription(
    product: any,
    limit: number = 80
  ): string {

    const desc =
      this.getProductDescription(
        product
      ).trim();


    if (!desc) {

      return '';

    }


    if (
      desc.length <= limit
    ) {

      return desc;

    }


    return (
      desc
        .substring(
          0,
          limit
        )
        .trim() +
      '...'
    );

  }


  getProductCode(
    product: any
  ): string {

    return String(

      product?.productCode ??

      product?.Product_Code ??

      ''

    ).trim();

  }


  getOldPrice(
    product: any
  ): number {

    return Number(

      product?.mrp ??

      product?.Mrp_Price ??

      0

    ) || 0;

  }


  getDiscount(
    product: any
  ): number {

    const price =
      this.getProductPrice(
        product
      );


    const oldPrice =
      this.getOldPrice(
        product
      );


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


  getProductKey(
    product: any
  ): string {

    return String(

     product?.productCode ??
 
      product?.Product_Code ??
 
      product?.id ??

      ''

    );

  }


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onProductImageError(
    product: any
  ): void {

    const key =
      this.getProductKey(
        product
      );


    this.productImageError = {

      ...this.productImageError,

      [key]: true

    };

  }


  // =========================================================
  // PRODUCT DETAIL
  // =========================================================

  goToProduct(
    product: Product
  ): void {

    this.router.navigate([
      '/product',
      this.getProductKey(
        product
      )
    ]);

  }


  // =========================================================
  // WISHLIST
  // =========================================================

  isWishlisted(
    product: any
  ): boolean {

    return this.wishlistService.isWishlisted(

      this.getProductKey(
        product
      )

    );

  }


  // =========================================================
  // ⭐ TOGGLE WISHLIST — now shows a bottom-right toast too,
  //    same as Add to Cart (added / removed based on prior state)
  // =========================================================

  toggleWishlist(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();

    event.preventDefault();


    const key = this.getProductKey(product);

    const wasWishlisted = this.wishlistService.isWishlisted(key);


    this.wishlistService.toggle(
      product
    );


    if (wasWishlisted) {

      this.showToast(
        `${this.getProductName(product)} removed from wishlist.`,
        'success'
      );

    }
    else {

      this.showToast(
        `${this.getProductName(product)} added to wishlist.`,
        'success'
      );

    }

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


  // =========================================================
  // ⭐ CUSTOMER DETAILS FROM LOCAL STORAGE
  // =========================================================

  private getStoredCustomer(): any | null {

    try {

      const possibleKeys = [

        'customer',

        'Customer',

        'customerData',

        'CustomerData',

        'loggedInCustomer',

        'LoggedInCustomer',

        'customerDetails',

        'CustomerDetails'

      ];


      for (
        const key of possibleKeys
      ) {

        const stored =
          localStorage.getItem(
            key
          );


        if (!stored) {

          continue;

        }


        try {

          const parsed =
            JSON.parse(
              stored
            );


          if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.Customer_Code
          ) {

            return parsed;

          }

        }
        catch {

          // Not JSON - continue checking

        }

      }


      const directCustomerCode =
        localStorage.getItem(
          'Customer_Code'
        );


      if (directCustomerCode) {

        return {

          Customer_Code:
            directCustomerCode,

          Customer_Name:
            localStorage.getItem(
              'Customer_Name'
            ) ?? '',

          Email_Id:
            localStorage.getItem(
              'Email_Id'
            ) ?? '',

          Mobile_No:
            localStorage.getItem(
              'Mobile_No'
            ) ?? ''

        };

      }


      return null;

    }
    catch (error) {

      console.error(
        'LOCAL STORAGE CUSTOMER READ ERROR:',
        error
      );


      return null;

    }

  }


  // =========================================================
  // GET CUSTOMER CODE
  // =========================================================

  private getCustomerCode(): string {

    const customer =
      this.getStoredCustomer();


    return String(

      customer?.Customer_Code ??

      ''

    ).trim();

  }


  // =========================================================
  // ⭐ ADD TO CART
  // =========================================================

  addToCart(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();
    event.preventDefault();

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {

      this.showToast(
        'Please login to add products to cart.',
        'error'
      );

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

      return;

    }

    const productCode = this.getProductCode(product);

    if (!productCode) {

      this.showToast(
        'Product Code not found.',
        'error'
      );

      return;

    }

    this.service.addToCart(

      product,
      1,

      () => {
        this.showToast(
          `${this.getProductName(product)} added to cart successfully.`,
          'success'
        );
      },

      (message) => {
        this.showToast(
          message ?? 'Unable to add product to cart.',
          'error'
        );
      }

    );

  }

  // =========================================================
  // QUICK VIEW
  // =========================================================

  openQuickView(
    product: Product,
    event: Event
  ): void {

    event.stopPropagation();

    event.preventDefault();


    this.selectedProduct =
      product;


    this.quickViewQuantity =
      1;


    this.quickViewImageError =
      false;


    this.quickViewOpen =
      true;

  }


  // =========================================================
  // CLOSE QUICK VIEW
  // =========================================================

  closeQuickView(): void {

    this.quickViewOpen =
      false;


    this.selectedProduct =
      null;


    this.quickViewQuantity =
      1;


    this.quickViewImageError =
      false;

  }


  // =========================================================
  // INCREASE QUANTITY
  // =========================================================

  increaseQuantity(): void {

    if (!this.selectedProduct) {

      return;

    }


    const maxStock =
      Number(
        (this.selectedProduct as any).stock
      ) || 0;


    this.quickViewQuantity =
      maxStock > 0

        ? Math.min(
            this.quickViewQuantity + 1,
            maxStock
          )

        : this.quickViewQuantity + 1;

  }


  // =========================================================
  // DECREASE QUANTITY
  // =========================================================

  decreaseQuantity(): void {

    this.quickViewQuantity =
      Math.max(

        1,

        this.quickViewQuantity - 1

      );

  }


  // =========================================================
  // ⭐ QUICK VIEW ADD TO CART
  // =========================================================

  addSelectedProductToCart(): void {

    if (!this.selectedProduct) {
      return;
    }

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {

      this.showToast(
        'Please login to add products to cart.',
        'error'
      );

      this.closeQuickView();

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

      return;

    }

    const productCode = this.getProductCode(this.selectedProduct);

    if (!productCode) {
      this.showToast('Product Code not found.', 'error');
      return;
    }

    const product = this.selectedProduct;

    this.service.addToCart(

      product,
      this.quickViewQuantity,

      () => {
        this.showToast(
          `${this.getProductName(product)} added to cart successfully.`,
          'success'
        );
        this.closeQuickView();
      },

      (message) => {
        this.showToast(
          message ?? 'Unable to add product to cart.',
          'error'
        );
      }

    );

  }

  // =========================================================
  // ⭐ BUY NOW
  // =========================================================

  buySelectedProduct(): void {

    if (!this.selectedProduct) {
      return;
    }

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {

      this.showToast('Please login to continue.', 'error');

      this.closeQuickView();

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

      return;

    }

    const product = this.selectedProduct;

    this.service.addToCart(

      product,
      this.quickViewQuantity,

      () => {
        this.closeQuickView();
        this.router.navigate(['/cart']);
      },

      (message) => {
        this.showToast(
          message ?? 'Unable to add product to cart.',
          'error'
        );
      }

    );

  }


}