import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '../../../service/common.service';
import { AdBannerComponent } from '../../shared/components/ad-banner/ad-banner.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AdBannerComponent
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {

  constructor(
    public cartService: CommonService
  ) {}

  ngOnInit(): void {

    this.cartService.loadCart();

  }

  increment(
    productId: string,
    currentQty: number
  ): void {

    this.cartService.updateQuantity(
      productId,
      currentQty + 1
    );

  }


  decrement(
    productId: string,
    currentQty: number
  ): void {

    if (currentQty <= 1) {
      return;
    }

    this.cartService.updateQuantity(
      productId,
      currentQty - 1
    );

  }

}