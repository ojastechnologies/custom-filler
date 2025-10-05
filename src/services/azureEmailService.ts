import { EmailClient, EmailMessage as AzureEmailMessage } from '@azure/communication-email';
import { azureEmailConfig, validateAzureConfig } from '@/config/azure';
import { EmailMessage, OrderConfirmationData, AdminNotificationData } from '@/types/email';

export class AzureEmailService {
  private client: EmailClient | null = null;
  private initialized = false;
  private initializationError: string | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      console.log('Azure Email Service: Starting initialization...');
      
      // First check if we have any connection string at all
      const connectionString = azureEmailConfig.connectionString;
      if (!connectionString) {
        this.initializationError = 'Azure Email Service: No connection string provided in environment variables';
        console.error(this.initializationError);
        return;
      }

      // Log connection string length for debugging (without showing the actual string)
      console.log('Azure Email Service: Raw connection string length:', connectionString.length);
      
      // Trim the connection string to remove any whitespace/newlines
      const trimmedConnectionString = connectionString.trim();
      
      console.log('Azure Email Service: Connection string analysis...', {
        originalLength: connectionString.length,
        trimmedLength: trimmedConnectionString.length,
        needsTrimming: connectionString !== trimmedConnectionString,
        hasEndpoint: trimmedConnectionString.includes('endpoint='),
        hasAccessKey: trimmedConnectionString.includes('accesskey='),
        hasProperSeparator: trimmedConnectionString.includes(';accesskey='),
        startsCorrectly: trimmedConnectionString.startsWith('endpoint='),
        // Check for common issues
        hasSpaces: trimmedConnectionString.includes(' '),
        hasNewlines: trimmedConnectionString.includes('\n') || trimmedConnectionString.includes('\r')
      });
      
      if (!validateAzureConfig()) {
        this.initializationError = 'Azure Email Service: Configuration validation failed';
        console.warn(this.initializationError);
        return;
      }

      // Validate connection string format more thoroughly
      if (!trimmedConnectionString.includes('endpoint=') || !trimmedConnectionString.includes('accesskey=')) {
        this.initializationError = 'Azure Email Service: Invalid connection string format. Expected format: endpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key';
        console.error(this.initializationError);
        return;
      }

      // Check if connection string is complete (has semicolon before accesskey)
      if (!trimmedConnectionString.includes(';accesskey=')) {
        // Check if it might be missing the semicolon
        if (trimmedConnectionString.includes('endpoint=') && trimmedConnectionString.includes('accesskey=')) {
          // The accesskey is present but not properly separated
          const parts = trimmedConnectionString.split('accesskey=');
          if (parts.length === 2) {
            const beforeAccessKey = parts[0];
            if (!beforeAccessKey.endsWith(';')) {
              this.initializationError = 'Azure Email Service: Connection string missing semicolon before accesskey. Should be: endpoint=...;accesskey=...';
              console.error(this.initializationError);
              return;
            }
          }
        }
        this.initializationError = 'Azure Email Service: Connection string appears incomplete - missing semicolon before access key';
        console.error(this.initializationError);
        return;
      }

      console.log('Azure Email Service: Creating EmailClient with connection string...');
      console.log('Azure Email Service: Connection string length to use:', trimmedConnectionString.length);
      
      // Log what the EmailClient constructor receives
      console.log('Azure Email Service: About to create EmailClient with:', {
        connectionString: 'connection string hidden for security',
        connectionHasEndpoint: trimmedConnectionString.includes('endpoint='),
        connectionHasAccessKey: trimmedConnectionString.includes('accesskey='),
        connectionHasSemicolon: trimmedConnectionString.includes(';accesskey=')
      });
      
      this.client = new EmailClient(trimmedConnectionString);
      this.initialized = true;
      this.initializationError = null;
      console.log('Azure Email Service: Initialized successfully');
      
    } catch (error) {
      console.error('Azure Email Service: Full error details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error type',
        errorStack: error instanceof Error ? error.stack : 'No stack available',
        connectionStringExists: !!azureEmailConfig.connectionString,
        connectionStringLength: azureEmailConfig.connectionString?.length
      });
      
      this.initializationError = `Azure Email Service: Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(this.initializationError, error);
      
      // Provide specific guidance for common errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid URL')) {
          this.initializationError += '\n\nThis usually means your AZURE_COMMUNICATION_CONNECTION_STRING is malformed. It should look like:\nendpoint=https://your-resource.communication.azure.com/;accesskey=your-access-key';
          
          // Additional debugging for URL errors
          const connectionString = azureEmailConfig.connectionString?.trim() || '';
          const parts = connectionString.split(';');
          console.error('Connection string debugging:', {
            hasMultipleParts: parts.length > 1,
            hasEndpoint: connectionString.includes('endpoint='),
            hasAccessKey: connectionString.includes('accesskey=')
          });
        }
      }
      
      this.client = null;
      this.initialized = false;
    }
  }

  // Public method to get initialization status
  public getStatus() {
    return {
      initialized: this.initialized,
      error: this.initializationError,
      hasClient: !!this.client
    };
  }

  private async sendEmail(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.initialized || !this.client) {
      const error = this.initializationError || 'Azure Email Service: Not initialized properly';
      console.error(error);
      return { success: false, error };
    }

    try {
      // Validate from email address
      if (!azureEmailConfig.fromEmail) {
        const error = 'Azure Email Service: From email address not configured';
        console.error(error);
        return { success: false, error };
      }

      // Validate recipients
      if (!message.to || message.to.length === 0) {
        const error = 'Azure Email Service: No recipients specified';
        console.error(error);
        return { success: false, error };
      }

      const emailMessage: AzureEmailMessage = {
        senderAddress: azureEmailConfig.fromEmail,
        content: {
          subject: message.subject,
          html: message.htmlContent,
          plainText: message.textContent || '',
        },
        recipients: {
          to: message.to.map(recipient => ({
            address: recipient.email,
            displayName: recipient.displayName || '',
          })),
        },
      };

      console.log('Azure Email Service: Sending email...', {
        to: message.to.map(r => r.email),
        subject: message.subject,
        from: azureEmailConfig.fromEmail
      });

      const poller = await this.client.beginSend(emailMessage);
      const result = await poller.pollUntilDone();

      console.log('Azure Email Service: Send result:', {
        status: result.status,
        id: result.id,
        error: result.error
      });

      if (result.status === 'Succeeded') {
        console.log('Azure Email Service: Email sent successfully:', result.id);
        return { success: true };
      } else {
        const error = `Azure Email Service: Email failed to send: ${result.error?.message || 'Unknown error'}`;
        console.error(error, result.error);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = `Azure Email Service: Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage, error);
      return { success: false, error: errorMessage };
    }
  }

  async sendOrderConfirmation(orderData: OrderConfirmationData): Promise<boolean> {
    try {
      console.log('Azure Email Service: Preparing customer confirmation email');
      
      if (!orderData.customerEmail) {
        console.error('Azure Email Service: Customer email not provided');
        return false;
      }

      const htmlTemplate = this.generateOrderConfirmationHTML(orderData);
      const textTemplate = this.generateOrderConfirmationText(orderData);

      const message: EmailMessage = {
        to: [{
          email: orderData.customerEmail,
          displayName: orderData.customerName,
        }],
        subject: `Order Confirmation - ${orderData.orderNumber}`,
        htmlContent: htmlTemplate,
        textContent: textTemplate,
      };

      const result = await this.sendEmail(message);
      if (!result.success) {
        console.error('Azure Email Service: Customer email failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Azure Email Service: Error in sendOrderConfirmation:', error);
      return false;
    }
  }

  async sendAdminNotification(orderData: AdminNotificationData): Promise<boolean> {
    try {
      console.log('Azure Email Service: Preparing admin notification email');
      
      if (!azureEmailConfig.adminEmail) {
        console.error('Azure Email Service: Admin email not configured');
        return false;
      }

      const htmlTemplate = this.generateAdminNotificationHTML(orderData);
      const textTemplate = this.generateAdminNotificationText(orderData);

      const message: EmailMessage = {
        to: [{
          email: azureEmailConfig.adminEmail,
          displayName: 'Admin',
        }],
        subject: `New Order Received - ${orderData.orderNumber}`,
        htmlContent: htmlTemplate,
        textContent: textTemplate,
      };

      const result = await this.sendEmail(message);
      if (!result.success) {
        console.error('Azure Email Service: Admin email failed:', result.error);
      }
      return result.success;
    } catch (error) {
      console.error('Azure Email Service: Error in sendAdminNotification:', error);
      return false;
    }
  }

  private generateOrderConfirmationHTML(data: OrderConfirmationData): string {
    // Format the date to be more human-readable
    const formattedDate = this.formatDate(data.orderDate);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .order-details { background-color: #ffffff; padding: 20px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
        .item-row { border-bottom: 1px solid #F3F4F6; padding: 10px 0; }
        .total-row { font-weight: bold; padding: 10px 0; border-top: 2px solid #3B82F6; }
        .address-section { margin-top: 20px; padding: 15px; background-color: #EFF6FF; border-radius: 8px; }
        .footer { margin-top: 30px; text-align: center; color: #6B7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order, ${data.customerName}!</p>
        </div>
        
        <div class="order-details">
            <h2 style="color: #3B82F6;">Order #${data.orderNumber}</h2>
            <p><strong>Order Date:</strong> ${formattedDate}</p>
            
            <h3>Order Items:</h3>
            ${data.orderItems.map(item => `
                <div class="item-row">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} × ${(item.price || 0).toFixed(2)} = ${(item.total || 0).toFixed(2)}
                </div>
            `).join('')}
            
            <div style="margin-top: 20px;">
                <div>Subtotal: ${(data.subtotal || 0).toFixed(2)}</div>
                ${data.discountAmount && data.discountAmount > 0 ? `<div style="color: #059669;">Discount: -${data.discountAmount.toFixed(2)}</div>` : ''}
                <div>Shipping: ${(data.shippingCost || 0).toFixed(2)}</div>
                <div>Tax: ${(data.taxAmount || 0).toFixed(2)}</div>
                <div class="total-row" style="color: #3B82F6;">Total: ${(data.totalAmount || 0).toFixed(2)}</div>
            </div>
        </div>
        
        <div class="address-section">
            <h3 style="color: #3B82F6;">Shipping Address:</h3>
            <p>
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
            </p>
        </div>
        
        <div class="footer">
            <p>If you have any questions about your order, please contact us.</p>
            <p>Thank you for your business!</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateOrderConfirmationText(data: OrderConfirmationData): string {
    return `
Order Confirmation - ${data.orderNumber}

Thank you for your order, ${data.customerName}!

ORDER DETAILS:
${data.orderItems.map(item => 
  `${item.name} - Qty: ${item.quantity} × $${(item.price || 0).toFixed(2)} = $${(item.total || 0).toFixed(2)}`
).join('\n')}

Subtotal: $${(data.subtotal || 0).toFixed(2)}
${data.discountAmount && data.discountAmount > 0 ? `Discount: -$${data.discountAmount.toFixed(2)}\n` : ''}Shipping: $${(data.shippingCost || 0).toFixed(2)}
Tax: $${(data.taxAmount || 0).toFixed(2)}
Total: $${(data.totalAmount || 0).toFixed(2)}

SHIPPING ADDRESS:
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

If you have any questions about your order, please contact us.
Thank you for your business!
    `;
  }

  private generateAdminNotificationHTML(data: AdminNotificationData): string {
    // Format the date to be more human-readable
    const formattedDate = this.formatDate(data.orderDate);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Order Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .order-details { background-color: #ffffff; padding: 20px; border: 1px solid #E5E7EB; border-radius: 0 0 8px 8px; }
        .item-row { border-bottom: 1px solid #F3F4F6; padding: 10px 0; }
        .total-row { font-weight: bold; padding: 10px 0; border-top: 2px solid #DC2626; }
        .customer-info { margin-top: 20px; padding: 15px; background-color: #FEF2F2; border-radius: 8px; }
        .urgent { background-color: #FEE2E2; border: 1px solid #FECACA; padding: 15px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Order Received!</h1>
            <p>Order #${data.orderNumber}</p>
        </div>
        
        <div class="order-details">
            <h2 style="color: #DC2626;">Order Details</h2>
            <p><strong>Order Date:</strong> ${formattedDate}</p>
            <p><strong>Payment Status:</strong> ${data.paymentStatus}</p>
            
            <h3>Customer Information:</h3>
            <p><strong>Name:</strong> ${data.customerName}</p>
            <p><strong>Email:</strong> ${data.customerEmail}</p>
            ${data.customerPhone ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
            
            <h3>Order Items:</h3>
            ${data.orderItems.map(item => `
                <div class="item-row">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} × ${(item.price || 0).toFixed(2)} = ${(item.total || 0).toFixed(2)}
                </div>
            `).join('')}
            
            <div style="margin-top: 20px;">
                <div>Subtotal: ${(data.subtotal || 0).toFixed(2)}</div>
                ${data.discountAmount && data.discountAmount > 0 ? `<div style="color: #059669;">Discount: -${data.discountAmount.toFixed(2)}</div>` : ''}
                <div>Shipping: ${(data.shippingCost || 0).toFixed(2)}</div>
                <div>Tax: ${(data.taxAmount || 0).toFixed(2)}</div>
                <div class="total-row" style="color: #DC2626;">Total: ${(data.totalAmount || 0).toFixed(2)}</div>
            </div>
        </div>
        
        <div class="customer-info">
            <h3 style="color: #DC2626;">Shipping Address:</h3>
            <p>
                ${data.shippingAddress.line1}<br>
                ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
            </p>
        </div>
        
        <div class="urgent">
            <p><strong>⚡ Action Required:</strong> Please process this order promptly.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateAdminNotificationText(data: AdminNotificationData): string {
    // Format the date to be more human-readable
    const formattedDate = this.formatDate(data.orderDate);
    
    return `
NEW ORDER NOTIFICATION - ${data.orderNumber}

Order Date: ${formattedDate}
Payment Status: ${data.paymentStatus}

CUSTOMER:
Name: ${data.customerName}
Email: ${data.customerEmail}
${data.customerPhone ? `Phone: ${data.customerPhone}\n` : ''}

ORDER ITEMS:
${data.orderItems.map(item => 
  `${item.name} - Qty: ${item.quantity} × ${(item.price || 0).toFixed(2)} = ${(item.total || 0).toFixed(2)}`
).join('\n')}

TOTALS:
Subtotal: ${(data.subtotal || 0).toFixed(2)}
${data.discountAmount && data.discountAmount > 0 ? `Discount: -${data.discountAmount.toFixed(2)}\n` : ''}Shipping: ${(data.shippingCost || 0).toFixed(2)}
Tax: ${(data.taxAmount || 0).toFixed(2)}
Total: ${(data.totalAmount || 0).toFixed(2)}

SHIPPING ADDRESS:
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

⚡ ACTION REQUIRED: Please process this order promptly.
    `;
  }
  
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // If date parsing fails, return original string
      console.warn('Failed to format date:', dateString, error);
      return dateString;
    }
  }
}

// Export singleton instance
export const azureEmailService = new AzureEmailService();