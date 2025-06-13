// Centralized product type for all components
export interface Deal {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductType {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  quantity?: number;
  about_url?: string;
  clientpathurl?: string;
  deal_id?: string;
  deal?: Deal;
}