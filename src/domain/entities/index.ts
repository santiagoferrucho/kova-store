// ── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus = 'pending'|'processing'|'shipped'|'delivered'|'cancelled';
export const ORDER_STATUSES: OrderStatus[] = ['pending','processing','shipped','delivered','cancelled'];

export interface Order {
  id: number; user_id: number; status: OrderStatus; total: number;
  shipping_address: string; payment_method: string;
  discount_type?: string | null; discount_amount: number; notes?: string | null;
  created_at: string; updated_at: string;
}

export interface OrderItem {
  id: number; order_id: number; product_id: number;
  name: string; price: number; quantity: number;
}

// ── Cart ─────────────────────────────────────────────────────────────────────
export interface Cart { id: number; user_id: number; created_at: string; }

export interface CartItem {
  id: number; cart_id: number; product_id: number; quantity: number;
}

export interface CartItemWithProduct extends CartItem {
  name: string; price: number; image_url?: string; stock: number;
}

// ── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: number; product_id: number; user_id: number;
  rating: number; comment?: string; created_at: string; user_name?: string;
}

// ── Coupon ───────────────────────────────────────────────────────────────────
export type CouponType = 'percent' | 'fixed' | 'volume';

export interface Coupon {
  id: number; code: string; type: CouponType;
  value: number; min_amount: number; active: number; expires_at?: string;
}
