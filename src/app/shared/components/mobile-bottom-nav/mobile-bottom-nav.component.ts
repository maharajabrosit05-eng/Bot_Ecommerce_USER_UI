import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { CommonService } from '../../../../service/common.service';
import { WishlistService } from '../../../core/services/wishlist.service';


@Component({
  selector: 'app-mobile-bottom-nav',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],

  templateUrl: './mobile-bottom-nav.component.html',

  styleUrl: './mobile-bottom-nav.component.scss'
})
export class MobileBottomNavComponent {

  constructor(
    public commonService: CommonService,
    public wishlistService:WishlistService,
    private router: Router
  ) { }


  get isLoggedIn(): boolean {
    return this.commonService.isLoggedIn();
    
  }


  goToProfile(): void {
    this.router.navigate([this.isLoggedIn ? '/profile' : '/login']);

  }

}