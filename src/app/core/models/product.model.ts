export interface Product {

  // =========================================================
  // BASIC PRODUCT DETAILS
  // =========================================================

  id: string;

  productCode: string;

  name: string;

  shortName?: string;

  category: string;

  brand: string;


  // =========================================================
  // PRICE DETAILS
  // =========================================================

  price: number;

  mrp: number;

  costPrice?: number;

  gst?: number;


  // =========================================================
  // PRODUCT INFORMATION
  // =========================================================

  description: string;

  sku?: string;

  barcode?: string;

  modelNo?: string;

  color?: string;

  warranty?: string;


  // =========================================================
  // STOCK
  // =========================================================

  stock: number;


  // =========================================================
  // IMAGE
  // =========================================================

  image: string;


  // =========================================================
  // STATUS
  // =========================================================

  isActive?: boolean;


  // =========================================================
  // OPTIONAL UI DETAILS
  // =========================================================

  oldPrice?: number;

  rating?: number;

  reviews?: number;

  tag?: 'New' | 'Best Seller' | 'Hot' | 'Limited';


  // =========================================================
  // SPECIFICATIONS
  // =========================================================

  specs?: {
    label: string;
    value: string;
  }[];


  // =========================================================
  // ORIGINAL API RESPONSE
  // =========================================================

  apiData?: any;

}


export interface CartItem {

  product: Product;

  quantity: number;

}


export interface Order {

  id: string;

  items: CartItem[];

  total: number;

  placedOn: Date;

  status: 'Placed' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';

  address: string;

  paymentMethod: string;

}