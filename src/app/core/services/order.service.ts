import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CartItem, Order } from '../models/product.model';

// exported so the component can derive step position without a second
// API call — same list drives the stepper UI.
export const STATUS_STEPS: Order['status'][] = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const STATUS_MAP: Record<string, Order['status']> = {
  'Order Placed': 'Placed',
  'Packed': 'Packed',
  'Shipped': 'Shipped',
  'Out For Delivery': 'Out for Delivery',
  'Delivered': 'Delivered',
  'Cancelled': 'Cancelled',
  'Returned': 'Returned'
};

function normalizeStatus(backendStatus: string): Order['status'] {
  return STATUS_MAP[backendStatus] ?? 'Placed';
}

export interface LiveStatusItem {
  orderItemId: number;
  productCode: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export interface LiveStatusResult {
  status: Order['status'];
  stepIndex: number;
  steps: Order['status'][];
  history: any[];
  items: LiveStatusItem[];
}

// ---- Cancel / Return / Refund support types ----

export interface CancelOrderPayload {
  OrderCode: string;
  CancelReason?: string;
  CancelledBy?: string;
  RefundMode?: string;
  CompanyCode?: string;
  BranchCode?: string;
}

export interface ReturnOrderItemPayload {
  OrderCode: string;
  OrderItemId: number;
  ReturnQty: number;
  LocationCode?: string;
  ReturnReason?: string;
  ReturnedBy?: string;
  RefundMode?: string;
  CompanyCode?: string;
  BranchCode?: string;
}

export interface UpdateOrderStatusPayload {
  OrderCode: string;
  NewStatus: string; // must match backend ValidStatuses exactly, e.g. "Packed", "Out For Delivery"
  ChangedBy?: string;
  ChangedByName?: string;
  Remarks?: string;
}

export interface ProcessRefundPayload {
  RefundCode: string;
  RefundTxnRef: string;
}

export interface CancelReturnDetails {
  cancellation: any[];
  returns: any[];
  refunds: any[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {

  private baseUrl = environment.apiUrl;

  private readonly orders = signal<Order[]>([]);

  readonly ordersList = this.orders.asReadonly();

  private productImageMap: Map<string, string> | null = null;
  private productImageMapLoading = false;
  private productImageMapWaiters: Array<(map: Map<string, string>) => void> = [];

  private loadProductImageMap(onReady: (map: Map<string, string>) => void): void {
    if (this.productImageMap) {
      onReady(this.productImageMap);
      return;
    }

    this.productImageMapWaiters.push(onReady);

    if (this.productImageMapLoading) {
      return;
    }
    this.productImageMapLoading = true;

    this.http.get(`${this.baseUrl}/api/Product/ItemList`).subscribe({
      next: (res: any) => {
        const map = new Map<string, string>();

        if (res?.status === true && Array.isArray(res.data)) {
          res.data.forEach((p: any) => {
            const code = p.Product_Code ?? p.ProductCode;
            const img = p.Product_Image ?? p.ProdImgUrl ?? p.ProductImage ?? p.Image ?? '';
            if (code && img) {
              map.set(String(code), img);
            }
          });
        }

        this.productImageMap = map;
        this.productImageMapLoading = false;
        this.productImageMapWaiters.forEach(fn => fn(map));
        this.productImageMapWaiters = [];
      },
      error: (err: any) => {
        console.error('PRODUCT IMAGE MAP LOAD ERROR:', err);
        this.productImageMap = new Map();
        this.productImageMapLoading = false;
        this.productImageMapWaiters.forEach(fn => fn(this.productImageMap!));
        this.productImageMapWaiters = [];
      }
    });
  }

  constructor(private http: HttpClient) {}

  // ==================================================================
  // PLACE ORDER
  // ==================================================================

  placeOrder(
    customerCode: string,
    items: CartItem[],
    address: { DeliveryAddress: string; City?: string; State?: string; Pincode: string; GSTIN?: string },
    paymentMethod: 'UPI' | 'CARD' | 'GPAY' | 'COD',
    onSuccess?: (order: Order) => void,
    onError?: (message?: string) => void
  ): void {

    const payload = {
      CustomerCode: customerCode,
      DeliveryAddress: address.DeliveryAddress,
      City: address.City,
      State: address.State,
      Pincode: address.Pincode,
      PaymentMethod: paymentMethod,
      // NEW: sent only when the person actually typed one on checkout.
      GSTIN: address.GSTIN ? address.GSTIN.trim().toUpperCase() : undefined,
      Items: items.map(i => ({
        ProductCode: (i as any).productCode ?? (i as any).product?.productCode,
        Qty: (i as any).quantity ?? (i as any).qty
      }))
    };

    this.http.post(`${this.baseUrl}/api/order/PlaceOrder`, payload).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          const order: Order = {
            id: res.data.Order_Code,
            items,
            total: res.data.Total_Amount,
            placedOn: new Date(),
            status: 'Placed',
            address: address.DeliveryAddress,
            // FIX: was res.data.Payment_Amount (amount/"Cash On Delivery" text)
            // being stuffed into paymentMethod — should be the actual method.
            paymentMethod: res.data.Payment_Method
          };
          this.orders.update(list => [order, ...list]);
          onSuccess?.(order);
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('PLACE ORDER ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }

  // ==================================================================
  // LOAD / READ ORDERS
  // ==================================================================

  loadOrders(customerCode: string, onDone?: () => void): void {
    this.http.get(`${this.baseUrl}/api/order/CustomerOrderList`, {
      params: { Customer_Code: customerCode }
    }).subscribe({
      next: (res: any) => {
        if (res?.status === true && Array.isArray(res.data)) {
          const list: Order[] = res.data.map((row: any) => ({
            id: row.Order_Code,
            items: [],
            total: Number(row.Total_Amount) || 0,
            placedOn: new Date(row.Created_On),
            status: normalizeStatus(row.Order_Status),
            address: row.Delivery_Address,
            // FIX: same mapping bug as placeOrder() above — use Payment_Method.
            paymentMethod: row.Payment_Method
          }));
          this.orders.set(list);
        }
        onDone?.();
      },
      error: (err: any) => {
        console.error('LOAD ORDERS ERROR:', err);
        onDone?.();
      }
    });
  }

  // GET api/order/AllOrders — admin grid, every order across all customers
  getAdminAllOrders(
    onResult: (orders: any[]) => void,
    onError?: (message?: string) => void
  ): void {
    this.http.get(`${this.baseUrl}/api/order/AllOrders`).subscribe({
      next: (res: any) => {
        if (res?.status === true && Array.isArray(res.data)) {
          onResult(res.data);
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('ADMIN ALL ORDERS ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }

  getOrder(id: string): Order | undefined {
    return this.orders().find(o => o.id === id);
  }

  getAllOrders(): Order[] {
    return this.orders();
  }

  getLiveStatus(
    orderId: string,
    onResult: (result: LiveStatusResult) => void
  ): void {
    this.http.get(`${this.baseUrl}/api/order/OrderTracking`, {
      params: { Order_Code: orderId }
    }).subscribe({
      next: (res: any) => {
        const backendStatus = res?.data?.Order?.[0]?.Order_Status ?? 'Order Placed';
        const status = normalizeStatus(backendStatus);
        const stepIndex = Math.max(0, STATUS_STEPS.indexOf(status));

        const rawItems = res?.data?.Items ?? res?.data?.items ?? res?.data?.OrderItems ?? [];

        const items: LiveStatusItem[] = Array.isArray(rawItems)
          ? rawItems.map((row: any) => ({
              orderItemId: Number(row.Order_Item_Id ?? row.OrderItemId) || 0,
              productCode: row.Product_Code ?? row.ProductCode ?? '',
              name: row.Product_Name ?? row.ProductName ?? row.Name ?? '',
              image: row.ProdImgUrl ?? row.Product_Image ?? row.ProductImage ?? row.Image ?? '',
              quantity: Number(row.Quantity ?? row.Qty) || 0,
              price: Number(row.Selling_Price ?? row.SellingPrice ?? row.Price) || 0
            }))
          : [];

        if (items.length === 0) {
          console.warn(
            `[OrderService] OrderTracking returned no items for Order_Code=${orderId}.`,
            res
          );
        }

        const history = res?.data?.History ?? [];

        const needsImagePatch = items.some(i => !i.image && i.productCode);

        if (!needsImagePatch) {
          onResult({ status, stepIndex, steps: STATUS_STEPS, history, items });
          return;
        }

        this.loadProductImageMap((imageMap) => {
          const patchedItems = items.map(item => ({
            ...item,
            image: item.image || imageMap.get(item.productCode) || ''
          }));
          onResult({ status, stepIndex, steps: STATUS_STEPS, history, items: patchedItems });
        });
      },
      error: (err: any) => {
        console.error('ORDER TRACKING ERROR:', err);
        onResult({ status: 'Placed', stepIndex: 0, steps: STATUS_STEPS, history: [], items: [] });
      }
    });
  }

  // ==================================================================
  // ORDER STATUS (admin)
  // ==================================================================

  // POST api/order/UpdateOrderStatus
  updateOrderStatus(
    payload: UpdateOrderStatusPayload,
    onSuccess?: () => void,
    onError?: (message?: string) => void
  ): void {
    this.http.post(`${this.baseUrl}/api/order/UpdateOrderStatus`, payload).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          // Reflect the new status locally so the UI doesn't wait on a reload
          this.orders.update(list =>
            list.map(o => o.id === payload.OrderCode
              ? { ...o, status: normalizeStatus(payload.NewStatus) }
              : o)
          );
          onSuccess?.();
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('UPDATE ORDER STATUS ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }

  // ==================================================================
  // CANCEL / RETURN / REFUND
  // ==================================================================

  // POST api/order/CancelOrder
  cancelOrder(
    payload: CancelOrderPayload,
    onSuccess?: (data: { cancellationCode: string; refundCode: string }) => void,
    onError?: (message?: string) => void
  ): void {
    this.http.post(`${this.baseUrl}/api/order/CancelOrder`, payload).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          this.orders.update(list =>
            list.map(o => o.id === payload.OrderCode ? { ...o, status: 'Cancelled' } : o)
          );
          onSuccess?.({
            cancellationCode: res.data?.Cancellation_Code,
            refundCode: res.data?.Refund_Code
          });
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('CANCEL ORDER ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }

  // POST api/order/ReturnOrderItem
returnOrderItem(
  payload: ReturnOrderItemPayload,
  onSuccess?: (data: {
    returnCode: string;
    refundCode: string;
    refundAmount: string;
  }) => void,
  onError?: (message?: string) => void
): void {

  this.http.post(
    `${this.baseUrl}/api/order/ReturnOrderItem`,
    payload
  ).subscribe({

    next: (res: any) => {

      if (res?.status === true) {

        // IMPORTANT:
        // Immediately update current UI state
        this.orders.update(list =>
          list.map(o =>
            o.id === payload.OrderCode
              ? { ...o, status: 'Returned' }
              : o
          )
        );

        onSuccess?.({
          returnCode: res.data?.Return_Code,
          refundCode: res.data?.Refund_Code,
          refundAmount: res.data?.Refund_Amount
        });

      } else {

        onError?.(res?.message);

      }

    },

    error: (err: any) => {

      console.error(
        'RETURN ORDER ITEM ERROR:',
        err
      );

      onError?.(
        err?.error?.message ||
        'Could not submit return request.'
      );

    }

  });
}

  // POST api/order/ProcessRefund (admin/finance side)
  processRefund(
    payload: ProcessRefundPayload,
    onSuccess?: () => void,
    onError?: (message?: string) => void
  ): void {
    this.http.post(`${this.baseUrl}/api/order/ProcessRefund`, payload).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          onSuccess?.();
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('PROCESS REFUND ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }

  // GET api/order/OrderCancelReturnDetails?Order_Code=...
  getCancelReturnDetails(
    orderCode: string,
    onResult: (details: CancelReturnDetails) => void,
    onError?: (message?: string) => void
  ): void {
    this.http.get(`${this.baseUrl}/api/order/OrderCancelReturnDetails`, {
      params: { Order_Code: orderCode }
    }).subscribe({
      next: (res: any) => {
        if (res?.status === true) {
          onResult({
            cancellation: res.data?.Cancellation ?? [],
            returns: res.data?.Returns ?? [],
            refunds: res.data?.Refunds ?? []
          });
        } else {
          onError?.(res?.message);
        }
      },
      error: (err: any) => {
        console.error('CANCEL RETURN DETAILS ERROR:', err);
        onError?.(err?.error?.message);
      }
    });
  }
}