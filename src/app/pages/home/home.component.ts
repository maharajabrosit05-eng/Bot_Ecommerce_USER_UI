import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../core/models/product.model';
import { WishlistService } from '../../core/services/wishlist.service';
import { CommonService } from '../../../service/common.service';


interface WhyUsItem {
  icon: string;
  title: string;
  desc: string;
}

interface Testimonial {
  name: string;
  role: string;
  rating: number;
  text: string;
}

interface CategoryGroup {
  category: string;
  products: Product[];
}


@Component({

  selector: 'app-home',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss'

})

export class HomeComponent implements OnInit, OnDestroy {


  // =========================================================
  // ⭐ PRODUCTS — loaded LIVE from the API
  // =========================================================

  allProducts: Product[] = [];

  loading = true;


  // =========================================================
  // BRAND / CATEGORY LISTS (for showcase cards)
  // =========================================================

  allBrands: string[] = [];

  allCategories: string[] = [];

  private brandLoopWidth = 0;
  private categoryLoopWidth = 0;
  // =========================================================
  // PRODUCTS GROUPED BY CATEGORY (main product listing)
  // =========================================================

  categoryGroups: CategoryGroup[] = [];

  private readonly productsPerCategory = 8;


  trackByAdCode(index: number, ad: any): string {
    return this.getAdKey(ad);
  }

  // =========================================================
  // WHY CHOOSE US
  // =========================================================

  whyChooseUs: WhyUsItem[] = [

    {
      icon: 'bi-patch-check-fill',
      title: '100% Genuine',
      desc: 'Every product is sourced from authorised distributors.'
    },
    {
      icon: 'bi-truck',
      title: 'Fast Shipping',
      desc: 'Quick, trackable delivery across India.'
    },
    {
      icon: 'bi-shield-lock-fill',
      title: 'Secure Payments',
      desc: 'UPI, cards, netbanking & EMI — all encrypted.'
    },
    {
      icon: 'bi-headset',
      title: 'Real Support',
      desc: 'Talk to a real person, not a bot, when it matters.'
    }

  ];


  // =========================================================
  // TESTIMONIALS
  // =========================================================

  testimonials: Testimonial[] = [

    {
      name: 'Arun Kumar',
      role: 'Gaming PC Build',
      rating: 5,
      text: 'Ordered a monitor and keyboard combo — genuine product, arrived in 2 days. Prices were better than the big marketplaces too.'
    },
    {
      name: 'Priya S.',
      role: 'Office Setup',
      rating: 5,
      text: 'Was worried about buying electronics online, but the warranty support team actually picked up the phone and helped me register my UPS.'
    },
    {
      name: 'Karthik R.',
      role: 'PC Upgrade',
      rating: 4,
      text: 'Good range of motherboards and CPUs. Combo pricing on the build saved me a good amount over buying separately.'
    }

  ];


  // =========================================================
  // ⭐ HERO SLIDER — LIVE FROM M_HOME_PAGE_BANNER (Admin panel)
  // =========================================================

  heroSlides: string[] = [];

  heroSlideLinks: string[] = [];

  private usingApiBanners = false;

  activeSlide = 0;

  private slideTimer?: ReturnType<typeof setInterval>;

  private heroImageErrors: { [index: number]: boolean } = {};


  // =========================================================
  // ⭐ ADVERTISEMENTS — LIVE FROM M_ADVERTISEMENT (Admin panel)
  // =========================================================

  ads: any[] = [];

  // ⭐ AD SLIDER STATE — one active index per Slot_No, auto-rotates like hero
  adActiveIndex: { [slot: number]: number } = {};

  private adTimers: { [slot: number]: any } = {};


  // Used only when the API sends a relative image path.
  private readonly apiImageBaseUrl = 'http://localhost:5153';


  // =========================================================
  // IMAGE ERROR TRACKING
  // =========================================================

  productImageError: { [key: string]: boolean } = {};

  adImageError: { [key: string]: boolean } = {};


  // =========================================================
  // ⭐ TOAST
  // =========================================================

  toastMessage: string | null = null;

  toastType: 'success' | 'error' = 'success';

  private toastTimer: any = null;


  // =========================================================
  // ⭐ SHOWCASE AUTO-SCROLL (Shop by Brand / Shop by Category)
  // FIX: previously used setInterval + scrollBy while the CSS also had
  // "scroll-behavior: smooth" — the two fought each other and the
  // track never visibly moved. Now uses a continuous
  // requestAnimationFrame loop that nudges scrollLeft directly (CSS
  // smooth-scroll removed for this element), with a retry loop so it
  // still finds the track even if the API data arrives late.
  // =========================================================

  @ViewChild('brandTrack') brandTrackRef?: ElementRef<HTMLElement>;
  @ViewChild('categoryTrack') categoryTrackRef?: ElementRef<HTMLElement>;

  private brandAutoScrollFrame?: number;
  private categoryAutoScrollFrame?: number;

  private brandScrollPaused = false;
  private categoryScrollPaused = false;

  private brandListenersAttached = false;
  private categoryListenersAttached = false;

  private brandManualResumeTimer?: ReturnType<typeof setTimeout>;
  private categoryManualResumeTimer?: ReturnType<typeof setTimeout>;


  // =========================================================
  // ⭐ SCROLL-TO-TOP BUTTON
  // =========================================================

  showScrollTop = false;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(

    private router: Router,

    private wishlistService: WishlistService,

    private service: CommonService

  ) { }


  // =========================================================
  // INIT / DESTROY
  // =========================================================

  ngOnInit(): void {

    this.loadBannersAndAds();

    this.loadProducts();

  }


  ngOnDestroy(): void {

    this.stopHeroSlider();
    this.stopAdSliders();
    this.stopShowcaseAutoScroll();

  }


  // =========================================================
  // ⭐ SCROLL-TO-TOP
  // =========================================================

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTop = (window.scrollY || document.documentElement.scrollTop || 0) > 300;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


  // =========================================================
  // ⭐ LOAD BANNERS (hero slider) + ADVERTISEMENTS (ad slots)
  // =========================================================

  private loadBannersAndAds(): void {

    // ---- Home page banner -> hero slider ----
    this.service.GetBannerList().subscribe({

      next: (res: any) => {

        const list = (res?.status === true && Array.isArray(res?.data)) ? res.data : [];

        if (list.length > 0) {

          this.heroSlides = list.map((b: any) => this.normalizeImageUrl(b.Image_Url));
          this.heroSlideLinks = list.map((b: any) => b.Redirect_Url || '');

          this.usingApiBanners = true;
          this.activeSlide = 0;
          this.heroImageErrors = {};

          this.startHeroSlider();
        }

      },

      error: (error: any) => {
        console.error('HOME — GET BANNER LIST API ERROR:', error);
      }

    });

    // ---- Advertisements -> ad slots ----
    this.service.GetAdvertisementList().subscribe({

      next: (res: any) => {
        this.ads = (res?.status === true && Array.isArray(res?.data)) ? res.data : [];
        this.startAdSliders();
      },

      error: (error: any) => {
        console.error('HOME — GET ADVERTISEMENT LIST API ERROR:', error);
        this.ads = [];
      }

    });

  }


  // =========================================================
  // ⭐ AD SLOT HELPERS
  // =========================================================

  /** Active ads for a given Slot_No (1-5), deduped by Advertisement_Code,
   *  ordered by Display_Order. Inactive ads never show on the storefront. */
  getAdsBySlot(slotNo: number): any[] {

    const seen = new Set<string>();

    return this.ads

      .filter((a: any) => Number(a.Slot_No) === slotNo)

      .filter((a: any) => {
        const status = String(a?.Status ?? a?.Is_Active ?? 'Active').trim().toLowerCase();
        return status === 'active' || status === 'a' || status === 'true' || status === '1';
      })

      .filter((a: any) => {
        const key = this.getAdKey(a);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      })

      .sort((a: any, b: any) => (Number(a.Display_Order) || 0) - (Number(b.Display_Order) || 0));

  }

  getAdImage(ad: any): string {
    return this.normalizeImageUrl(ad?.Image_Url);
  }

  getAdKey(ad: any): string {
    return String(ad?.Advertisement_Code ?? '');
  }

  onAdImageError(ad: any): void {

    const key = this.getAdKey(ad);

    this.adImageError = {
      ...this.adImageError,
      [key]: true
    };
  }

  /** ⭐ Ad slot 3 was repeating after every 2nd category group, so with more
   *  than 2 categories it visually appeared "twice" (or more). This makes
   *  it render only ONE time on the whole page — after the 2nd category
   *  group, or after the last one if there's only a single category. */
  shouldShowCategoryAd(index: number): boolean {

    if (this.categoryGroups.length <= 1) {
      return index === 0;
    }

    return index === 1;
  }


  // =========================================================
  // ⭐ AD SLIDER — auto-rotate each slot independently
  // =========================================================

  private startAdSliders(): void {

    this.stopAdSliders();

    for (const slot of [1, 2, 3, 4, 5]) {

      const ads = this.getAdsBySlot(slot);

      if (ads.length > 1) {

        this.adActiveIndex[slot] = this.adActiveIndex[slot] || 0;

        this.adTimers[slot] = setInterval(() => {

          const len = this.getAdsBySlot(slot).length;

          if (len > 0) {
            this.adActiveIndex[slot] = (this.adActiveIndex[slot] + 1) % len;
          }

        }, 4000);

      }

    }

  }

  private stopAdSliders(): void {

    Object.values(this.adTimers).forEach(t => clearInterval(t));
    this.adTimers = {};

  }

  goToAdSlide(slot: number, index: number): void {
    this.adActiveIndex[slot] = index;
  }


  // =========================================================
  // ⭐ LOAD PRODUCTS FROM API
  // =========================================================

  private loadProducts(): void {

    this.loading = true;

    this.service.GetAllProducts().subscribe({

      next: (res: any) => {

        if (res?.status === true && Array.isArray(res?.data)) {

          this.allProducts = res.data.map((item: any) => this.mapToProduct(item));

        } else {

          this.allProducts = [];

        }

        this.buildBrandsAndCategories();

        if (!this.usingApiBanners) {
          this.buildHeroSlides();
        }

        this.buildCategoryGroups();

        this.loading = false;

        this.startShowcaseAutoScroll();

      },

      error: (error: any) => {

        console.error('HOME — GET ALL PRODUCTS API ERROR:', error);

        this.allProducts = [];

        this.buildBrandsAndCategories();

        this.loading = false;

      }

    });

  }


  // =========================================================
  // ⭐ MAP RAW API ROW -> Product
  // =========================================================

  private mapToProduct(item: any): Product {

    return {

      id:
        item.U_Id ??
        item.ProductId ??
        item.Product_Code ??
        '',

      productCode: item.Product_Code ?? '',

      name:
        item.Product_Name ||
        item.Online_Display_Name ||
        item.Print_Name ||
        '',

      shortName: item.Product_Short_Name ?? '',

      category: item.Category_Name ?? '',

      brand: item.Brand_Name ?? '',

      description: item.Description ?? '',

      price: Number(item.Selling_Price) || 0,

      mrp: Number(item.Mrp_Price) || 0,

      oldPrice: Number(item.Mrp_Price) || 0,

      costPrice: Number(item.Cost_Price) || 0,

      gst: Number(item.Gst ?? item.Gst_Per) || 0,

      stock: Number(item.CurrentStock) || 0,

      sku: item.SKU ?? '',

      barcode: item.Barcode ?? '',

      modelNo: item.Model_No ?? '',

      color: item.Color_Name ?? '',

      warranty: item.Warranty_Name || item.Warranty_Period || '',

      image: this.normalizeImageUrl(
        item.ProdImgUrl ||
        item.Product_Image ||
        item.Image_Path ||
        item.ProductImg ||
        item.ImageUrl ||
        item.Image ||
        ''
      ),

      rating:
        Number(
          item.Star_Rating ??
          item.Rating ??
          item.AverageRating ??
          0
        ) || 0,

      isActive: item.Is_Active === 'A',

      reviews: 0,

      specs: [],

      tag: undefined,

      apiData: item

    } as Product;

  }


  // =========================================================
  // HERO SLIDER (fallback — only used when no admin banners exist)
  // =========================================================

  private buildHeroSlides(): void {

    const uniqueImages = new Set<string>();

    for (const product of this.allProducts) {
      const image = this.normalizeImageUrl((product as any).image);

      if (image) {
        uniqueImages.add(image);
      }

      if (uniqueImages.size >= 6) {
        break;
      }
    }

    this.heroSlides = Array.from(uniqueImages);
    this.heroSlideLinks = this.heroSlides.map(() => '');
    this.activeSlide = 0;
    this.heroImageErrors = {};

    this.startHeroSlider();
  }

  private normalizeImageUrl(value: any): string {

    const raw = String(value ?? '').trim();

    if (!raw) {
      return '';
    }

    if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
      return raw;
    }

    const cleanPath = raw.startsWith('/') ? raw : `/${raw}`;

    return `${this.apiImageBaseUrl}${cleanPath}`;
  }

  onHeroImageError(index: number): void {

    this.heroImageErrors[index] = true;

    this.heroSlides = this.heroSlides.filter((_, i) => i !== index);
    this.heroSlideLinks = this.heroSlideLinks.filter((_, i) => i !== index);

    if (this.activeSlide >= this.heroSlides.length) {
      this.activeSlide = 0;
    }

    this.startHeroSlider();
  }

  private startHeroSlider(): void {

    this.stopHeroSlider();

    if (this.heroSlides.length <= 1) {
      return;
    }

    this.slideTimer = setInterval(() => {

      this.activeSlide =
        (this.activeSlide + 1) % this.heroSlides.length;

    }, 4000);

  }

  goToSlide(index: number): void {

    if (index < 0 || index >= this.heroSlides.length) {
      return;
    }

    this.activeSlide = index;

    this.startHeroSlider();

  }

  private stopHeroSlider(): void {

    if (this.slideTimer) {
      clearInterval(this.slideTimer);
      this.slideTimer = undefined;
    }

  }


  // =========================================================
  // BUILD BRAND / CATEGORY LISTS
  // =========================================================

  private buildBrandsAndCategories(): void {

    this.allBrands = [
      ...new Set(
        this.allProducts
          .map((p: any) => String(p.brand ?? '').trim())
          .filter(v => v.length > 0)
      )
    ];

    this.allCategories = [
      ...new Set(
        this.allProducts
          .map((p: any) => String(p.category ?? '').trim())
          .filter(v => v.length > 0)
      )
    ];

  }


  // =========================================================
  // ⭐ BUILD PRODUCTS GROUPED BY CATEGORY
  // =========================================================

  private buildCategoryGroups(): void {

    this.categoryGroups = this.allCategories

      .map(cat => ({

        category: cat,

        products: this.allProducts

          .filter((p: any) =>
            String(p.category ?? '').trim().toLowerCase() === cat.trim().toLowerCase()
          )

          .slice(0, this.productsPerCategory)

      }))

      .filter(group => group.products.length > 0);

  }


  // =========================================================
  // SHOWCASE CARD IMAGE / COUNT HELPERS
  // =========================================================

  getBrandImage(brand: string): string {

    const product = this.allProducts.find((p: any) =>
      String(p.brand ?? '').trim().toLowerCase() === brand.trim().toLowerCase() &&
      !!p.image
    );

    return product ? (product as any).image : '';
  }

  getCategoryImage(cat: string): string {

    const product = this.allProducts.find((p: any) =>
      String(p.category ?? '').trim().toLowerCase() === cat.trim().toLowerCase() &&
      !!p.image
    );

    return product ? (product as any).image : '';
  }

  getBrandCount(brand: string): number {

    return this.allProducts.filter((p: any) =>
      String(p.brand ?? '').trim().toLowerCase() === brand.trim().toLowerCase()
    ).length;
  }

  getCategoryCount(cat: string): number {

    return this.allProducts.filter((p: any) =>
      String(p.category ?? '').trim().toLowerCase() === cat.trim().toLowerCase()
    ).length;
  }


  // =========================================================
  // ⭐ SHOWCASE SCROLL (Shop by Brand / Shop by Category)
  // =========================================================

  /**
   * Scroll one showcase carousel in either direction.
   * The track contains TWO copies of the same cards. We use the full
   * duplicated track for movement and only normalize after reaching
   * either physical end, so both arrows work infinitely.
   */
  scrollTrack(track: HTMLElement, direction: number): void {
    if (!track || !direction) {
      return;
    }

    const loopWidth = this.getShowcaseLoopWidth(track);

    if (loopWidth <= 0) {
      return;
    }

    const isBrand = track === this.brandTrackRef?.nativeElement;
    const isCategory = track === this.categoryTrackRef?.nativeElement;
    const step = Math.max(120, Math.floor(track.clientWidth * 0.8));

    // Pause auto-scroll briefly while the user is using the arrows.
    if (isBrand) {
      this.brandScrollPaused = true;
      if (this.brandManualResumeTimer) {
        clearTimeout(this.brandManualResumeTimer);
      }
      this.brandManualResumeTimer = setTimeout(() => {
        this.brandScrollPaused = false;
      }, 900);
    }

    if (isCategory) {
      this.categoryScrollPaused = true;
      if (this.categoryManualResumeTimer) {
        clearTimeout(this.categoryManualResumeTimer);
      }
      this.categoryManualResumeTimer = setTimeout(() => {
        this.categoryScrollPaused = false;
      }, 900);
    }

    let current = track.scrollLeft;

    // LEFT from the beginning -> jump to the equivalent position in copy #2.
    if (direction < 0 && current <= 1) {
      track.scrollLeft = loopWidth;
      current = loopWidth;
    }

    let target = current + (step * direction);

    // RIGHT past the duplicated content -> normalize by one complete copy.
    if (target >= (loopWidth * 2)) {
      track.scrollLeft = target - loopWidth;
      target = track.scrollLeft;
    }

    // LEFT past the beginning -> normalize by one complete copy.
    if (target < 0) {
      track.scrollLeft = target + loopWidth;
      target = track.scrollLeft;
    }

    track.scrollTo({
      left: target,
      behavior: 'smooth'
    });
  }

  /** Distance from the first card to the first card of the duplicate copy. */
  private getShowcaseLoopWidth(track: HTMLElement): number {
    const totalCards = track.children.length;
    const originalCount = Math.floor(totalCards / 2);

    if (originalCount <= 0 || totalCards <= originalCount) {
      return 0;
    }

    const duplicateFirst = track.children[originalCount] as HTMLElement;
    return duplicateFirst?.offsetLeft ?? 0;
  }

  /** Kicks off both showcase carousels after Angular has rendered the API data. */
  private startShowcaseAutoScroll(): void {
    this.stopShowcaseAutoScroll();

    this.brandListenersAttached = false;
    this.categoryListenersAttached = false;

    let attempts = 0;

    const tryStart = () => {
      attempts++;

      const brandEl = this.brandTrackRef?.nativeElement;
      const categoryEl = this.categoryTrackRef?.nativeElement;

      if (brandEl && !this.brandListenersAttached) {
        this.brandListenersAttached = true;

        brandEl.addEventListener('mouseenter', () => this.brandScrollPaused = true);
        brandEl.addEventListener('mouseleave', () => this.brandScrollPaused = false);
        brandEl.addEventListener('touchstart', () => this.brandScrollPaused = true, { passive: true });
        brandEl.addEventListener('touchend', () => this.brandScrollPaused = false, { passive: true });

        this.brandLoopWidth = this.getShowcaseLoopWidth(brandEl);
        this.runShowcaseLoop(brandEl, 'brand');
      }

      if (categoryEl && !this.categoryListenersAttached) {
        this.categoryListenersAttached = true;

        categoryEl.addEventListener('mouseenter', () => this.categoryScrollPaused = true);
        categoryEl.addEventListener('mouseleave', () => this.categoryScrollPaused = false);
        categoryEl.addEventListener('touchstart', () => this.categoryScrollPaused = true, { passive: true });
        categoryEl.addEventListener('touchend', () => this.categoryScrollPaused = false, { passive: true });

        this.categoryLoopWidth = this.getShowcaseLoopWidth(categoryEl);
        this.runShowcaseLoop(categoryEl, 'category');
      }

      if ((!brandEl || !categoryEl) && attempts < 15) {
        setTimeout(tryStart, 300);
      }
    };

    setTimeout(tryStart, 200);
  }

  /** Continuous auto-scroll. It normalizes only after the full duplicated track. */
  private runShowcaseLoop(track: HTMLElement, key: 'brand' | 'category'): void {
    const speedPxPerFrame = 0.6;

    const step = () => {
      const paused = key === 'brand'
        ? this.brandScrollPaused
        : this.categoryScrollPaused;

      const loopWidth = this.getShowcaseLoopWidth(track);

      if (!paused && loopWidth > 0) {
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (maxScroll > 0) {
          track.scrollLeft += speedPxPerFrame;

          // We have two identical copies. Keep the scroll position in the
          // second half after reaching the physical end. This is visually
          // seamless because copy #1 and copy #2 are identical.
          if (track.scrollLeft >= maxScroll - 1) {
            track.scrollLeft = Math.max(0, track.scrollLeft - loopWidth);
          }
        }
      }

      const frameId = requestAnimationFrame(step);

      if (key === 'brand') {
        this.brandAutoScrollFrame = frameId;
      } else {
        this.categoryAutoScrollFrame = frameId;
      }
    };

    step();
  }

  private stopShowcaseAutoScroll(): void {
    if (this.brandAutoScrollFrame !== undefined) {
      cancelAnimationFrame(this.brandAutoScrollFrame);
      this.brandAutoScrollFrame = undefined;
    }

    if (this.categoryAutoScrollFrame !== undefined) {
      cancelAnimationFrame(this.categoryAutoScrollFrame);
      this.categoryAutoScrollFrame = undefined;
    }

    if (this.brandManualResumeTimer) {
      clearTimeout(this.brandManualResumeTimer);
      this.brandManualResumeTimer = undefined;
    }

    if (this.categoryManualResumeTimer) {
      clearTimeout(this.categoryManualResumeTimer);
      this.categoryManualResumeTimer = undefined;
    }
  }


  // =========================================================
  // PRODUCT HELPERS
  // =========================================================

  getProductName(product: any): string {
    return String(product?.name ?? 'Unnamed Product');
  }

  getProductImage(product: any): string {
    return product?.image || '';
  }

  getProductPrice(product: any): number {
    return Number(product?.price ?? 0) || 0;
  }

  getOldPrice(product: any): number {
    return Number(product?.mrp ?? product?.oldPrice ?? 0) || 0;
  }

  getDiscount(product: any): number {

    const price = this.getProductPrice(product);
    const oldPrice = this.getOldPrice(product);

    if (!oldPrice || oldPrice <= price) {
      return 0;
    }

    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }

  getCategory(product: any): string {
    return String(product?.category ?? '');
  }

  getBrand(product: any): string {
    return String(product?.brand ?? '');
  }

  getRating(product: any): number {
    return Number(product?.rating ?? 0) || 0;
  }

  getRoundedRating(product: any): number {
    return Math.min(5, Math.max(0, Math.round(this.getRating(product))));
  }

  /** ⭐ Full stars — rounds UP into a full star once the decimal is
   *  0.75 or higher (e.g. 4.8 -> 5 full stars). */
  getFullStars(product: any): number {

    const rating = Math.min(5, Math.max(0, this.getRating(product)));
    const floor = Math.floor(rating);
    const decimal = rating - floor;

    return decimal >= 0.75 ? floor + 1 : floor;
  }

  /** ⭐ Half star — shown when the decimal part is roughly in the
   *  middle (0.25 to 0.75), e.g. 3.5 -> 3 full stars + 1 half star. */
  getHasHalfStar(product: any): boolean {

    const rating = Math.min(5, Math.max(0, this.getRating(product)));
    const floor = Math.floor(rating);
    const decimal = rating - floor;

    return decimal >= 0.25 && decimal < 0.75;
  }

  getEmptyStars(product: any): number {

    const full = this.getFullStars(product);
    const half = this.getHasHalfStar(product) ? 1 : 0;

    return Math.max(0, 5 - full - half);
  }

  starsArray(count: number): number[] {
    return Array(Math.max(0, Math.floor(count))).fill(0);
  }

  getProductKey(product: any): string {
    return String(product?.productCode ?? product?.id ?? '');
  }

  onProductImageError(product: any): void {

    const key = this.getProductKey(product);

    this.productImageError = {
      ...this.productImageError,
      [key]: true
    };
  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  goToProduct(product: Product): void {

    this.router.navigate(['/product', this.getProductKey(product)]);
  }


  // =========================================================
  // WISHLIST
  // =========================================================

  isWishlisted(product: any): boolean {

    return this.wishlistService.isWishlisted(this.getProductKey(product));
  }

  toggleWishlist(product: Product, event: Event): void {

    event.stopPropagation();
    event.preventDefault();

    this.wishlistService.toggle(product);

    if (this.isWishlisted(product)) {
      this.showToast(`${this.getProductName(product)} added to wishlist.`, 'success');
    } else {
      this.showToast(`${this.getProductName(product)} removed from wishlist.`, 'success');
    }
  }


  // =========================================================
  // CUSTOMER (localStorage)
  // =========================================================

  private getStoredCustomer(): any | null {

    try {

      const possibleKeys = [
        'customer', 'Customer', 'customerData', 'CustomerData',
        'loggedInCustomer', 'LoggedInCustomer', 'customerDetails', 'CustomerDetails'
      ];

      for (const key of possibleKeys) {

        const stored = localStorage.getItem(key);

        if (!stored) {
          continue;
        }

        try {

          const parsed = JSON.parse(stored);

          if (parsed && typeof parsed === 'object' && parsed.Customer_Code) {
            return parsed;
          }

        } catch {
          // not JSON, continue
        }

      }

      const directCustomerCode = localStorage.getItem('Customer_Code');

      if (directCustomerCode) {

        return {
          Customer_Code: directCustomerCode,
          Customer_Name: localStorage.getItem('Customer_Name') ?? '',
          Email_Id: localStorage.getItem('Email_Id') ?? '',
          Mobile_No: localStorage.getItem('Mobile_No') ?? ''
        };

      }

      return null;

    } catch (error) {

      console.error('LOCAL STORAGE CUSTOMER READ ERROR:', error);

      return null;
    }
  }


  // =========================================================
  // ⭐ ADD TO CART
  // =========================================================

  addToCart(product: Product, event: Event): void {

    event.stopPropagation();
    event.preventDefault();

    const customer = this.getStoredCustomer();

    if (!customer || !customer.Customer_Code) {

      this.showToast('Please login to add products to cart.', 'error');

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1200);

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
  // ⭐ TOAST HELPERS
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


  // =========================================================
  // TESTIMONIAL STARS
  // =========================================================

  getStars(count: number): number[] {
    return Array(count).fill(0);
  }


  // =========================================================
  // SKELETON PLACEHOLDERS (for loading state)
  // =========================================================

  get skeletons(): number[] {
    return Array(6).fill(0);
  }



}