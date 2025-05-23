// Centralized product type for all components
export interface ProductType {
  id: string;
  title: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  quantity?: number;
  about_url?: string;
}