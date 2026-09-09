import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService, LiveStatusResult, LiveStatusItem, STATUS_STEPS } from '../../core/services/order.service';
import { Order } from '../../core/models/product.model';

type FilterKey = 'all' | 'active' | 'delivered' | 'cancelled';
type StepState = 'completed' | 'current' | 'pending';

const AUTO_REFRESH_MS = 15000;

@Component({
  selector: 'app-my-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './my-order.component.html',
  styleUrl: './my-order.component.css'
})
export class MyOrderComponent implements OnInit, OnDestroy {

  productDetailRoute = '/product-detail';

  loading = true;
  errorMessage = '';

  selectedOrderId: string | null = null;

  // liveResults now only supplies ITEMS + HISTORY for the detail panel.
  // Status/step is always derived from the Order object itself
  // (orderService.ordersList()), which is the one place that's kept
  // reliably in sync with the backend on every load/refresh. This is
  // what fixes the "badge says Packed but stepper says Placed" bug —
  // there used to be two different sources of truth for status.
  liveResults: Record<string, LiveStatusResult> = {};

  loadingOrderId: string | null = null;

  previewLoading: Record<string, boolean> = {};

  animateReady: Record<string, boolean> = {};
  journeyMoving: Record<string, boolean> = {};

  activeFilter: FilterKey = 'all';
  searchTerm = '';

  refreshing = false;

  readonly steps = STATUS_STEPS;

  statusClass: Record<string, string> = {
    'Placed': 'status-placed',
    'Packed': 'status-packed',
    'Shipped': 'status-shipped',
    'Out for Delivery': 'status-out',
    'Delivered': 'status-delivered',
    'Cancelled': 'status-cancelled',
    'Returned': 'status-returned'
  };

  historyIcons: Record<string, string> = {
    'Order Placed': 'assets/img/order-placed.png',
  };

  // ---------------------------------------------------------------
  // CANCEL ORDER
  // ---------------------------------------------------------------
  showCancelModal = false;
  cancelReason = '';
  cancelling = false;
  cancelError = '';

  // ---------------------------------------------------------------
  // RETURN ITEM — only offered once order.status === 'Delivered'
  // ---------------------------------------------------------------
  showReturnModal = false;
  selectedReturnItem: LiveStatusItem | null = null;
  returnReason = '';
  returnQty = 1;
  returnError = '';
  returningProductCode: string | null = null;

  private customerCode = '';
  private autoRefreshHandle: any = null;

  constructor(public orderService: OrderService) { }

  ngOnInit(): void {
    this.customerCode = this.getCustomerCode();

    if (!this.customerCode) {
      this.loading = false;
      this.errorMessage = 'Please login to view your orders.';
      return;
    }

    this.orderService.loadOrders(this.customerCode, () => {
      this.loading = false;
      this.prefetchPreviews();
      this.ensureSelectionValid();
    });

    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshHandle) {
      clearInterval(this.autoRefreshHandle);
      this.autoRefreshHandle = null;
    }
  }

  private startAutoRefresh(): void {
    this.autoRefreshHandle = setInterval(() => {
      this.silentRefresh();
    }, AUTO_REFRESH_MS);
  }

  private silentRefresh(): void {
    if (!this.customerCode) { return; }

    // Refreshing the order list alone already fixes the status/badge/
    // stepper everywhere, since they all read from order.status now.
    this.orderService.loadOrders(this.customerCode, () => {
      Object.keys(this.liveResults).forEach(orderId => {
        this.orderService.getLiveStatus(orderId, (result) => {
          this.liveResults[orderId] = result;
        });
      });
    });
  }

  manualRefresh(): void {
    if (!this.customerCode || this.refreshing) { return; }

    this.refreshing = true;
    this.orderService.loadOrders(this.customerCode, () => {
      const ids = Object.keys(this.liveResults);
      if (ids.length === 0) {
        this.refreshing = false;
        return;
      }

      let pending = ids.length;
      ids.forEach(orderId => {
        this.orderService.getLiveStatus(orderId, (result) => {
          this.liveResults[orderId] = result;
          pending--;
          if (pending <= 0) {
            this.refreshing = false;
          }
        });
      });
    });
  }

  private getCustomerCode(): string {
    try {
      const raw = localStorage.getItem('customer');
      const customer = raw ? JSON.parse(raw) : null;
      return customer?.Customer_Code?.trim() || '';
    } catch {
      return '';
    }
  }

  private prefetchPreviews(): void {
    for (const order of this.orderService.ordersList()) {
      if (this.liveResults[order.id]) { continue; }
      this.previewLoading[order.id] = true;

      this.orderService.getLiveStatus(order.id, (result) => {
        this.liveResults[order.id] = result;
        this.previewLoading[order.id] = false;
      });
    }
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  get countAll(): number {
    return this.orderService.ordersList().length;
  }
  get countActive(): number {
    return this.orderService.ordersList().filter(o =>
      o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Returned'
    ).length;
  }
  get countDelivered(): number {
    return this.orderService.ordersList().filter(o => o.status === 'Delivered').length;
  }
  get countCancelled(): number {
    return this.orderService.ordersList().filter(o =>
      o.status === 'Cancelled' || o.status === 'Returned'
    ).length;
  }

  setFilter(filter: FilterKey): void {
    this.activeFilter = filter;
    this.ensureSelectionValid();
  }

  onSearchChange(): void {
    this.ensureSelectionValid();
  }

  get filteredOrders(): Order[] {
    let list = this.orderService.ordersList();

    if (this.activeFilter === 'active') {
      list = list.filter(o =>
        o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Returned'
      );
    } else if (this.activeFilter === 'delivered') {
      list = list.filter(o => o.status === 'Delivered');
    } else if (this.activeFilter === 'cancelled') {
      list = list.filter(o => o.status === 'Cancelled' || o.status === 'Returned');
    }

    const term = this.searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(o => {
        if (o.id.toLowerCase().includes(term)) { return true; }
        const preview = this.liveResults[o.id];
        if (preview?.items?.length) {
          return preview.items.some(it => (it.name || '').toLowerCase().includes(term));
        }
        return false;
      });
    }

    return [...list].sort((a, b) => b.placedOn.getTime() - a.placedOn.getTime());
  }

  get selectedOrder(): Order | undefined {
    if (!this.selectedOrderId) { return undefined; }
    return this.orderService.ordersList().find(o => o.id === this.selectedOrderId);
  }

  private ensureSelectionValid(): void {
    const list = this.filteredOrders;
    if (!list.length) {
      return;
    }
    const stillValid = list.some(o => o.id === this.selectedOrderId);
    if (!stillValid) {
      this.selectOrder(list[0]);
    }
  }

  selectOrder(order: Order): void {
    if (this.selectedOrderId === order.id && this.liveResults[order.id]) {
      return;
    }

    this.selectedOrderId = order.id;
    this.animateReady[order.id] = false;
    this.journeyMoving[order.id] = false;

    const playReplay = () => {
      setTimeout(() => {
        this.animateReady[order.id] = true;
        this.journeyMoving[order.id] = true;
        setTimeout(() => { this.journeyMoving[order.id] = false; }, 900);
      }, 80);
    };

    if (this.liveResults[order.id]) {
      playReplay();
      return;
    }

    this.loadingOrderId = order.id;
    this.orderService.getLiveStatus(order.id, (result) => {
      this.liveResults[order.id] = result;
      if (this.loadingOrderId === order.id) {
        this.loadingOrderId = null;
      }
      playReplay();
    });
  }

  // -----------------------------------------------------------------
  // STEP STATE — single source of truth (order.status) drives colors:
  //   completed step -> green
  //   current step (order's exact status) -> orange
  //   pending (not reached yet) -> grey (default)
  // -----------------------------------------------------------------
  stepState(orderId: string, step: Order['status']): StepState {
    const order = this.orderService.getOrder(orderId);
    const currentIdx = order ? STATUS_STEPS.indexOf(order.status) : 0;
    const idx = STATUS_STEPS.indexOf(step);

    if (idx < currentIdx) { return 'completed'; }
    if (idx === currentIdx) { return 'current'; }
    return 'pending';
  }

  displayStepIndex(orderId: string): number {
    if (!this.animateReady[orderId]) { return 0; }
    const order = this.orderService.getOrder(orderId);
    return order ? Math.max(0, STATUS_STEPS.indexOf(order.status)) : 0;
  }

  // -----------------------------------------------------------------
  // CANCEL ORDER
  // Allowed any time before the order is Delivered, and only once —
  // an already Cancelled/Returned order can't be cancelled again.
  // -----------------------------------------------------------------
  canCancelOrder(order: Order): boolean {
    return order.status !== 'Delivered' &&
      order.status !== 'Cancelled' &&
      order.status !== 'Returned';
  }

  openCancelModal(): void {
    if (!this.selectedOrder || !this.canCancelOrder(this.selectedOrder)) { return; }
    this.cancelReason = '';
    this.cancelError = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    if (this.cancelling) { return; }
    this.showCancelModal = false;
  }

  confirmCancelOrder(): void {
    const order = this.selectedOrder;
    if (!order || this.cancelling) { return; }

    this.cancelling = true;
    this.cancelError = '';

    this.orderService.cancelOrder(
      {
        OrderCode: order.id,
        CancelReason: this.cancelReason.trim() || undefined,
        CancelledBy: this.customerCode
      },
      () => {
        this.cancelling = false;
        this.showCancelModal = false;
        // Pull the timeline fresh so the "Cancelled" entry shows immediately.
        this.orderService.getLiveStatus(order.id, (result) => {
          this.liveResults[order.id] = result;
        });
      },
      (message) => {
        this.cancelling = false;
        this.cancelError = message || 'Could not cancel this order. Please try again.';
      }
    );
  }

  // -----------------------------------------------------------------
  // RETURN ITEM
  // Only ever offered on a Delivered order — enforced both here
  // (button hidden by canReturnOrder in the template) and again as a
  // guard in openReturnModal, so it can't be triggered any other way.
  // -----------------------------------------------------------------
  canReturnOrder(order: Order): boolean {
    return order.status === 'Delivered';
  }

  private markOrderAsReturned(orderId: string): void {

    const order = this.orderService.getOrder(orderId);

    if (!order) {
      return;
    }

    order.status = 'Returned';

    // Re-select the same order so Angular updates the UI
    this.selectedOrderId = orderId;

    // Reset animation state
    this.animateReady[orderId] = true;
    this.journeyMoving[orderId] = false;
  }

  openReturnModal(item: LiveStatusItem): void {
    const order = this.selectedOrder;
    if (!order || !this.canReturnOrder(order)) { return; }

    this.selectedReturnItem = item;
    this.returnReason = '';
    this.returnQty = 1;
    this.returnError = '';
    this.showReturnModal = true;
  }

  closeReturnModal(): void {
    if (this.returningProductCode) { return; }
    this.showReturnModal = false;
    this.selectedReturnItem = null;
  }

  confirmReturnItem(): void {
    const order = this.selectedOrder;
    const item = this.selectedReturnItem;
    if (!order || !item || this.returningProductCode) { return; }

    if (!item.orderItemId) {
      this.returnError = 'Unable to process a return for this item right now.';
      return;
    }

    if (!this.returnQty || this.returnQty <= 0 || this.returnQty > item.quantity) {
      this.returnError = `Return quantity must be between 1 and ${item.quantity}.`;
      return;
    }

    this.returningProductCode = item.productCode;
    this.returnError = '';

    this.orderService.returnOrderItem(
      {
        OrderCode: order.id,
        OrderItemId: item.orderItemId,
        ReturnQty: this.returnQty,
        ReturnReason: this.returnReason.trim() || undefined,
        ReturnedBy: this.customerCode
      },

      () => {

        this.returningProductCode = null;
        this.showReturnModal = false;
        this.selectedReturnItem = null;
        this.markOrderAsReturned(order.id);

        this.orderService.getLiveStatus(order.id, (result) => {
          this.liveResults[order.id] = result;
        });

      },

      (message) => {
        this.returningProductCode = null;
        this.returnError = message || 'Could not submit the return request. Please try again.';
      }
    );
  }
}