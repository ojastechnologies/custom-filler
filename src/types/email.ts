export interface EmailRecipient {
  email: string;
  displayName?: string;
}

export interface EmailMessage {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    image?: string;
  }>;
  subtotal: number;
  discountAmount?: number;
  dealCode?: string;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentStatus: string;
  paymentIntentId?: string;
  orderDate: string;
}

export type AdminNotificationData = OrderConfirmationData;

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailServiceConfig {
  connectionString: string;
  fromEmail: string;
  adminEmail: string;
}

export interface EmailAttachment {
  name: string;
  content: string;
  contentType: string;
}