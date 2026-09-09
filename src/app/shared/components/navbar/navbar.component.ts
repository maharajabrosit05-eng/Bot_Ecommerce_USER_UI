import {
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { WishlistService } from '../../../core/services/wishlist.service';

import { CommonService } from '../../../../service/common.service';








interface CategoryIcon {
  name: string;
  icon: string;
}


@Component({
  selector: 'app-navbar',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    RouterLink
  ],

  templateUrl: './navbar.component.html',

  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  // =========================================================
  // SEARCH STATE
  // =========================================================

  searchTerm = '';
  searchLoading = false;
  searchFocused = false;

  products: any[] = [];
  filteredProducts: any[] = [];
  productsLoaded = false;


  constructor(

    public wishlistService: WishlistService,


    public commonService: CommonService,
    private commonService1: CommonService,
    private router: Router

  ) { }


  ngOnInit(): void {

    this.loadProducts();


    this.commonService.loadCart();


    this.commonService.refreshLoggedCustomer();
     this.loadCategories();

  }


  // =========================================================
  // LOGIN STATE HELPERS (used in template)
  // =========================================================

  get isLoggedIn(): boolean {
    return this.commonService.isLoggedIn();
  }

  get customerName(): string {
    return this.commonService.customerDisplayName();
  }

  logout(): void {
    this.commonService.logout();
    this.router.navigate(['/login']);
  }


  // =========================================================
  // LOAD ALL PRODUCTS (used by the search dropdown)
  // =========================================================

  loadProducts(): void {

    this.commonService.GetAllProducts()
      .subscribe({

        next: (response: any) => {

          this.products = this.extractArray(response);
          this.productsLoaded = true;

        },

        error: (error) => {

          console.error('Error loading products:', error);
          this.products = [];
          this.productsLoaded = false;

        }

      });

  }


  private extractArray(response: any): any[] {

    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.Data)) return response.Data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response?.Result)) return response.Result;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.Items)) return response.Items;

    return [];

  }


  // =========================================================
  // SEARCH DROPDOWN (inline in the navbar, replaces the old
  // full side drawer — opens under the search box instead)
  // =========================================================

  onSearchFocus(): void {

    this.searchFocused = true;

    if (!this.productsLoaded) {
      this.loadProducts();
    }

  }


  onSearchBlur(): void {

    // Small delay so a mousedown on a result item registers
    // (and navigates) before the dropdown disappears.
    setTimeout(() => {
      this.searchFocused = false;
    }, 150);

  }


  searchProducts(): void {

    const search = this.searchTerm.trim().toLowerCase();

    if (!search) {
      this.filteredProducts = [];
      return;
    }

    this.searchLoading = true;

    setTimeout(() => {

      this.filteredProducts =
        this.products
          .filter((product: any) => {

            const name = this.getProductName(product).toLowerCase();
            const code = this.getProductCode(product).toLowerCase();
            const sku = String(
              product?.SKU ?? product?.Sku ?? product?.sku ?? ''
            ).toLowerCase();

            return (
              name.includes(search) ||
              code.includes(search) ||
              sku.includes(search)
            );

          })
          .slice(0, 20);

      this.searchLoading = false;

    }, 150);

  }


  getProductName(product: any): string {

    return String(
      product?.Product_Name ??
      product?.ProductName ??
      product?.product_name ??
      product?.name ??
      'Unnamed Product'
    );

  }


  getProductCode(product: any): string {

    return String(
      product?.Product_Code ??
      product?.ProductCode ??
      product?.product_code ??
      product?.Code ??
      ''
    );

  }


  getProductPrice(product: any): number {

    return Number(
      product?.Selling_Price ??
      product?.SellingPrice ??
      product?.selling_price ??
      product?.Price ??
      product?.price ??
      0
    ) || 0;

  }


  getProductImage(product: any): string {

    return (
      product?.Product_Image ??
      product?.ProductImage ??
      product?.Image_Path ??
      product?.ImagePath ??
      product?.Image_URL ??
      product?.ImageUrl ??
      product?.image ??
      ''
    );

  }


  onImageError(event: Event): void {

    const image = event.target as HTMLImageElement;
    image.style.display = 'none';

  }


  clearSearch(): void {

    this.searchTerm = '';
    this.filteredProducts = [];

  }


  selectProduct(product: any): void {

    const productCode = this.getProductCode(product);

    this.searchTerm = '';
    this.filteredProducts = [];
    this.searchFocused = false;

    if (productCode) {
      this.router.navigate(['/products'], {
        queryParams: { q: productCode }
      });
    } else {
      this.router.navigate(['/products']);
    }

  }









  categories: CategoryIcon[] = [];

  loading = false;


  // =========================================================
  // CATEGORY NAME -> BOOTSTRAP ICON
  // Any category not listed here automatically falls back
  // to a generic box icon, so new categories never break
  // the row.
  // =========================================================

  private categoryIconMap: Record<string, string> = {

    Monitor: 'bi-display',
    Mouse: 'bi-mouse2',
    Keyboard: 'bi-keyboard',
    CPU: 'bi-cpu',
    UPS: 'bi-battery-charging',
    Motherboard: 'bi-motherboard',
    Laptop: 'bi-laptop',
    Desktop: 'bi-pc-display',
    Tablet: 'bi-tablet',
    Mobile: 'bi-phone',
    Speaker: 'bi-speaker',
    Headphone: 'bi-headphones',
    Printer: 'bi-printer',
    Camera: 'bi-camera',
    Router: 'bi-router'

  };

  private loadCategories(): void {

    this.loading = true;

    this.commonService.CategoryList()
      .subscribe({

        next: (response: any) => {

          const data = this.extractArray(response);
          const names = this.extractNames(data);

          this.categories = names.map(name => ({
            name,
            icon: this.categoryIconMap[name] || 'bi-box-seam'
          }));

          this.loading = false;

        },

        error: (error) => {

          console.error('Error loading categories for category bar:', error);
          this.categories = [];
          this.loading = false;

        }

      });

  }




  private extractNames(data: any[]): string[] {

    const values =
      data
        .map((item: any) => {

          if (typeof item === 'string') {
            return item.trim();
          }

          return String(
            item?.Category_Name ??
            item?.CategoryName ??
            item?.category_name ??
            item?.categoryName ??
            item?.Category ??
            item?.category ??
            item?.Name ??
            item?.name ??
            ''
          ).trim();

        })
        .filter((name: string) => !!name);

    return [...new Set(values)];

  }


}