import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [ CommonModule,
             RouterLink
           ],
  templateUrl: './help-page.component.html',
  styleUrl: './help-page.component.css'
})
export class HelpPageComponent {

faqs = [
    {
      question: 'How can I place an order?',
      answer: 'Browse the products, select the product you want, add it to your cart and proceed to checkout.'
    },
    {
      question: 'How can I track my order?',
      answer: 'Go to My Order from your account and select the order you want to track.'
    },
    {
      question: 'How can I cancel my order?',
      answer: 'Open My Order, select the applicable order and use the cancellation option if the order is eligible for cancellation.'
    },
    {
      question: 'How can I return a product?',
      answer: 'Open the delivered order from My Order and select the Return option if the product is eligible for return.'
    },
    {
      question: 'How can I reset my password?',
      answer: 'Go to the Login page, select Forgot Password and follow the instructions to reset your password.'
    },
    {
      question: 'What products are available?',
      answer: 'BROS IT SOLUTIONS offers monitors, CPUs, UPS units, keyboards, mice, printers, laptops, desktops, tablets and other computer accessories.'
    }
  ];

}
