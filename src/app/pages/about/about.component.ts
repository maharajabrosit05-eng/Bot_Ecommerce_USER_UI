import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ValueItem {
  icon: string;
  title: string;
  desc: string;
}

interface StatItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {

  stats: StatItem[] = [
    { value: '5000+', label: 'Happy Customers' },
    { value: '16+', label: 'Product Categories' },
    { value: '10+', label: 'Trusted Brands' },
    { value: '24/7', label: 'Customer Support' }
  ];

  values: ValueItem[] = [
    {
      icon: 'bi-shield-check',
      title: 'Genuine Products',
      desc: 'Every product we sell is 100% genuine, sourced directly from authorized brand partners.'
    },
    {
      icon: 'bi-truck',
      title: 'Reliable Delivery',
      desc: 'From our warehouse to your doorstep — tracked, careful, and on time.'
    },
    {
      icon: 'bi-headset',
      title: 'Real Support',
      desc: 'A support team that actually picks up the phone and helps with warranty & service.'
    },
    {
      icon: 'bi-currency-rupee',
      title: 'Fair Pricing',
      desc: 'Competitive prices without compromising on product quality or after-sales support.'
    }
  ];

}
