import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'BROS IT SOLUTIONS - Home'
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent),
    title: 'BROS IT SOLUTIONS - Products'
  },
  {
    path: 'products-card',
    loadComponent: () => import('./pages/product-card/product-card.component').then(m => m.ProductCardComponent),
    title: 'BROS IT SOLUTIONS - Products'
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
    title: 'BROS IT SOLUTIONS - Product Detail'
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    title: 'BROS IT SOLUTIONS - Your Cart'
  },

  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'BROS IT SOLUTIONS - Your Cart'
  },

  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
    title: 'BROS IT SOLUTIONS - Your Cart'
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./pages/account-settings/account-settings.component').then(m => m.AccountSettingsComponent),
    title: 'BROS IT SOLUTIONS - Account Settings'
  }, {
    path: 'my_order',
    loadComponent: () => import('./pages/my-order/my-order.component').then(m => m.MyOrderComponent),
    title: 'BROS IT SOLUTIONS - Your Cart'
  },

  {
    path: 'contact',
    loadComponent: () => import('./pages/contact-us/contact-us.component').then(m => m.ContactUsComponent),
    title: 'BROS IT SOLUTIONS - Your Cart'
  },

  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent),
    title: 'BROS IT SOLUTIONS - Wishlist'
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'BROS IT SOLUTIONS - Checkout & Payment'
  },
  {
    path: 'order-success/:id',
    loadComponent: () => import('./pages/order-success/order-success.component').then(m => m.OrderSuccessComponent),
    title: 'BROS IT SOLUTIONS - Order Placed'
  },
  {
    path: 'track-order',
    loadComponent: () => import('./pages/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent),
    title: 'BROS IT SOLUTIONS - Track Order'
  },
  {
    path: 'category-bar',
    loadComponent: () => import('./shared/components/category-bar/category-bar.component').then(m => m.CategoryBarComponent),
    title: 'BROS IT SOLUTIONS - Track Order'
  },

  {
    path: 'mobile-bottom-nav',
    loadComponent: () => import('./shared/components/mobile-bottom-nav/mobile-bottom-nav.component').then(m => m.MobileBottomNavComponent),
    title: 'BROS IT SOLUTIONS - Track Order'
  },

  {
    path: 'conditions_of_us',
    loadComponent: () => import('./pages/policy/conditions-of-use/conditions-of-use.component').then(m => m.ConditionsOfUseComponent),
    title: 'BROS IT SOLUTIONS - Track Order'
  },

  {
    path: 'privacy_notice',
    loadComponent: () => import('./pages/policy/privacy-notice/privacy-notice.component').then(m => m.PrivacyNoticeComponent),
    title: 'BROS IT SOLUTIONS - Privacy Notice'
  },

  {
    path: 'help',
    loadComponent: () =>
      import('./pages/policy/help-page/help-page.component')
        .then(m => m.HelpPageComponent),
    title: 'BROS IT SOLUTIONS - Help'
  },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'BROS IT SOLUTIONS - Track Order'
  },

  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'BROS IT SOLUTIONS - Not Found'
  }
];
