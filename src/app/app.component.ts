import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { LoginPopupComponent } from './shared/components/login-popup/login-popup.component';
import { CategoryBarComponent } from './shared/components/category-bar/category-bar.component';
import { MobileBottomNavComponent } from './shared/components/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LoginPopupComponent,
    CategoryBarComponent,
    MobileBottomNavComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  title = 'electro-shop';

  /**
   * Live pixel value bound to --header-height on .app-main.
   *
   * ⭐ FIX: this used to be just the sticky nav's own
   * `.height` (navbar + category-bar). That's wrong at the
   * top of the page, because the announcement bar (logo /
   * delivery-address row) is still in normal document flow
   * ABOVE the sticky nav at that point — so the real on-screen
   * header is announcement-bar height + sticky-nav height, but
   * the variable only accounted for the second part. Anything
   * fixed/sticky elsewhere (e.g. the Products page filter
   * drawer) that reads var(--header-height) therefore started
   * too high and got hidden behind the navbar.
   *
   * Using getBoundingClientRect().bottom instead of .height
   * fixes this for every scroll state automatically:
   *   - at the top of the page: bottom = announcement-bar
   *     height + sticky-nav height (both still visible)
   *   - scrolled down: announcement bar has scrolled away,
   *     sticky nav is pinned at top:0, so bottom = just the
   *     sticky-nav height
   * No guessing required — it's always exactly what's painted
   * on screen right now.
   */
  headerHeight = 0;

  private resizeObserver?: ResizeObserver;
  private headerStackEl?: HTMLElement;
  private scrollRafId: number | null = null;
  private readonly onScrollOrResize = () => this.scheduleMeasure();

  // Re-attaches on every (re)creation of the sticky nav element —
  // e.g. it doesn't exist at all on pages that hide the navbar/
  // category bar, or on /login.
  @ViewChild('headerStack') set headerStackRef(ref: ElementRef<HTMLDivElement> | undefined) {
    this.resizeObserver?.disconnect();
    window.removeEventListener('scroll', this.onScrollOrResize);
    window.removeEventListener('resize', this.onScrollOrResize);
    this.headerStackEl = undefined;

    if (!ref) {
      this.headerHeight = 0;
      return;
    }

    this.headerStackEl = ref.nativeElement;

    // Wait a frame so the navbar/category-bar (added/removed via
    // *ngIf) have finished rendering before the first measurement.
    requestAnimationFrame(() => this.scheduleMeasure());

    // Re-measure whenever the stack's own size changes — category
    // row wraps to a second line, search bar switches to a stacked
    // mobile layout, banner text wraps, orientation change, etc.
    this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
    this.resizeObserver.observe(this.headerStackEl);

    // ⭐ Re-measure on scroll too — this is what makes the value
    // correct both at the top of the page (announcement bar still
    // visible above the sticky nav) and after scrolling past it
    // (announcement bar gone, sticky nav pinned at top:0).
    // Passive + rAF-throttled so it stays cheap during fast scroll.
    window.addEventListener('scroll', this.onScrollOrResize, { passive: true });
    window.addEventListener('resize', this.onScrollOrResize);
  }

  private scheduleMeasure(): void {
    if (this.scrollRafId !== null) {
      return; // already scheduled for this frame
    }
    this.scrollRafId = requestAnimationFrame(() => {
      this.scrollRafId = null;
      this.measureHeader();
    });
  }

  private measureHeader(): void {
    if (!this.headerStackEl) {
      return;
    }

    const bottom = this.headerStackEl.getBoundingClientRect().bottom;
    const height = Math.max(0, Math.round(bottom));

    // Avoid a redundant change-detection run if nothing changed
    if (height !== this.headerHeight) {
      this.zone.run(() => (this.headerHeight = height));
    }
  }

  // The /login page is a distraction-free, standalone screen —
  // no top bar, no navbar, no footer, just the login form.
  isLoginPage = false;

  // Navbar + Category bar should be visible ONLY on:
  //   Home            -> '/' or '/home'
  //   Products (grid) -> '/products'
  //   Product Details -> '/product/:id'
  showNavAndCategoryBar = false;

  private readonly navVisibleExactPaths = ['/', '/home', '/products'];
  private readonly navVisiblePrefixes = ['/product/'];

  constructor(private router: Router, private zone: NgZone) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        const currentPath = event.urlAfterRedirects.split('?')[0].split('#')[0];

        this.isLoginPage = currentPath.startsWith('/login');

        this.showNavAndCategoryBar =
          this.navVisibleExactPaths.includes(currentPath) ||
          this.navVisiblePrefixes.some(prefix => currentPath.startsWith(prefix));
      });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    window.removeEventListener('scroll', this.onScrollOrResize);
    window.removeEventListener('resize', this.onScrollOrResize);

    if (this.scrollRafId !== null) {
      cancelAnimationFrame(this.scrollRafId);
    }
  }
}