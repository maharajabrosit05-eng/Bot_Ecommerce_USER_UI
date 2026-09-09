import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/product.model';

interface LiveStatusResult {
  status: Order['status'];
  stepIndex: number;
  steps: Order['status'][];
  history: any[];
}

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss'
})
export class OrderTrackingComponent implements OnInit {
  orderIdInput = '';
  searchedOrder?: Order;
  notFound = false;
  allOrders: Order[] = [];
  loadingStatus = false;

  // NEW: holds the result of the async getLiveStatus() call for the
  // currently searched order. Template reads THIS instead of calling
  // a function that can't return synchronously anymore.
  liveResult?: LiveStatusResult;

  stepIcons: Record<string, string> = {
    Placed: 'bi-bag-check',
    Packed: 'bi-box-seam',
    Shipped: 'bi-truck',
    'Out for Delivery': 'bi-geo-alt',
    Delivered: 'bi-house-check'
  };

  constructor(private orderService: OrderService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.allOrders = this.orderService.getAllOrders();
    const fromQuery = this.route.snapshot.queryParamMap.get('orderId');
    if (fromQuery) {
      this.orderIdInput = fromQuery;
      this.track();
    }
  }

  track(): void {
    const order = this.orderService.getOrder(this.orderIdInput.trim());
    this.searchedOrder = order;
    this.notFound = !order;
    this.liveResult = undefined;

    if (!order) {
      return;
    }

    this.loadingStatus = true;

    // getLiveStatus is now async (real API call) -> use the callback
    this.orderService.getLiveStatus(order.id, (result) => {
      this.liveResult = result;
      this.loadingStatus = false;
    });
  }

  // Maps the 5-step status onto the big-picture 3-stage journey:
  // Warehouse -> Delivery Person -> Customer
  // Now reads from the stored liveResult instead of re-calling the service.
  get journeyStage(): number | null {
    if (!this.liveResult) {
      return null;
    }
    const idx = this.liveResult.stepIndex;
    if (idx <= 1) return 0;       // Placed, Packed             -> Warehouse
    if (idx <= 3) return 1;       // Shipped, Out for Delivery  -> Delivery Person
    return 2;                     // Delivered                  -> Customer
  }
}