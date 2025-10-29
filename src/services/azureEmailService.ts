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
    // Format phone number
    const formattedPhone = this.formatPhoneNumber(data.customerPhone);
    
    // Log shipping address for debugging
    console.log('📧 Email Template - Shipping Address Data:', {
      line1: data.shippingAddress?.line1,
      line2: data.shippingAddress?.line2,
      city: data.shippingAddress?.city,
      state: data.shippingAddress?.state,
      postalCode: data.shippingAddress?.postalCode,
      country: data.shippingAddress?.country
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1F2937;
            background-color: #F9FAFB;
            margin: 0;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #FFFFFF;
        }
        .header { 
            background-color: #3B82F6; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
        }
        .content { 
            padding: 20px; 
        }
        .order-number {
            background-color: #EFF6FF;
            border: 1px solid #DBEAFE;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .order-number h2 {
            color: #3B82F6;
            margin: 0 0 5px 0;
            font-size: 20px;
        }
        .order-number p {
            color: #6B7280;
            margin: 0;
            font-size: 14px;
        }
        .section { 
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px; 
            padding: 15px;
            margin-bottom: 15px;
        }
        .section h3 {
            color: #1F2937;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
        }
        .section-icon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
        }
        .info-row { 
            padding: 6px 0;
            font-size: 14px;
        }
        .info-row:not(:last-child) {
            border-bottom: 1px solid #F3F4F6;
        }
        .info-label { 
            font-weight: 600; 
            color: #6B7280;
            display: inline-block;
            min-width: 80px;
        }
        .info-value { 
            color: #1F2937;
        }
        .item-row { 
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        .item-name {
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 4px;
        }
        .item-details {
            color: #6B7280;
            font-size: 14px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .summary-label {
            color: #6B7280;
        }
        .summary-value {
            color: #1F2937;
            font-weight: 500;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 16px;
            font-weight: 700;
            color: #3B82F6;
            border-top: 2px solid #E5E7EB;
            margin-top: 8px;
        }
        .address-content {
            color: #1F2937;
            font-size: 14px;
            line-height: 1.8;
        }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center; 
            color: #6B7280; 
            font-size: 13px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Order Confirmation</h1>
            <p>Thank you for your order, ${data.customerName}!</p>
        </div>
        
        <div class="content">
            <div class="order-number">
                <h2>Order #${data.orderNumber}</h2>
                <p>Order Date: ${formattedDate}</p>
            </div>
            
            <!-- Customer Information -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                </h3>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${data.customerEmail}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${data.customerName}</span>
                </div>
                ${formattedPhone ? `
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${formattedPhone}</span>
                </div>
                ` : ''}
            </div>

            <!-- Shipping Address -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shipping Address
                </h3>
                <div class="address-content">
                    ${data.shippingAddress.line1}<br>
                    ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                    ${data.shippingAddress.city}${data.shippingAddress.state ? ', ' + data.shippingAddress.state : ''} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                </div>
            </div>
            
            <!-- Order Items -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Order Items (${data.orderItems.length})
                </h3>
                ${data.orderItems.map(item => `
                    <div class="item-row">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">
                            Quantity: ${item.quantity} × $${(item.price || 0).toFixed(2)} = $${(item.total || 0).toFixed(2)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Order Summary -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Order Summary
                </h3>
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">$${(data.subtotal || 0).toFixed(2)}</span>
                </div>
                ${data.discountAmount && data.discountAmount > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Discount${data.dealCode ? ` (${data.dealCode})` : ''}:</span>
                    <span class="summary-value" style="color: #059669;">-$${data.discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span class="summary-label">Shipping:</span>
                    <span class="summary-value">$${(data.shippingCost || 0).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Tax:</span>
                    <span class="summary-value">$${(data.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Total:</span>
                    <span>$${(data.totalAmount || 0).toFixed(2)} ${data.currency || 'USD'}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>If you have any questions about your order, please contact us.</p>
                <p>Thank you for your business!</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateOrderConfirmationText(data: OrderConfirmationData): string {
    const formattedDate = this.formatDate(data.orderDate);
    const formattedPhone = this.formatPhoneNumber(data.customerPhone);
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           ORDER CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your order, ${data.customerName}!

Order #${data.orderNumber}
Order Date: ${formattedDate}

─────────────────────────────────────────────
CUSTOMER INFORMATION
─────────────────────────────────────────────
Email: ${data.customerEmail}
Name: ${data.customerName}
${formattedPhone ? `Phone: ${formattedPhone}\n` : ''}
─────────────────────────────────────────────
SHIPPING ADDRESS
─────────────────────────────────────────────
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}${data.shippingAddress.state ? ', ' + data.shippingAddress.state : ''} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

─────────────────────────────────────────────
ORDER ITEMS (${data.orderItems.length})
─────────────────────────────────────────────
${data.orderItems.map(item => 
  `${item.name}
Qty: ${item.quantity} × $${(item.price || 0).toFixed(2)} = $${(item.total || 0).toFixed(2)}`
).join('\n\n')}

─────────────────────────────────────────────
ORDER SUMMARY
─────────────────────────────────────────────
Subtotal:        $${(data.subtotal || 0).toFixed(2)}
${data.discountAmount && data.discountAmount > 0 ? `Discount${data.dealCode ? ` (${data.dealCode})` : ''}:      -$${data.discountAmount.toFixed(2)}\n` : ''}Shipping:        $${(data.shippingCost || 0).toFixed(2)}
Tax:             $${(data.taxAmount || 0).toFixed(2)}
─────────────────────────────────────────────
TOTAL:           $${(data.totalAmount || 0).toFixed(2)} ${data.currency || 'USD'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions about your order, please contact us.
Thank you for your business!
    `;
  }

  private generateAdminNotificationHTML(data: AdminNotificationData): string {
    // Format the date to be more human-readable
    const formattedDate = this.formatDate(data.orderDate);
    const formattedPhone = this.formatPhoneNumber(data.customerPhone);
    
    // Log shipping address for debugging
    console.log('📧 Admin Email Template - Shipping Address Data:', {
      line1: data.shippingAddress?.line1,
      line2: data.shippingAddress?.line2,
      city: data.shippingAddress?.city,
      state: data.shippingAddress?.state,
      postalCode: data.shippingAddress?.postalCode,
      country: data.shippingAddress?.country
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Order Notification</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #1F2937;
            background-color: #FEF2F2;
            margin: 0;
            padding: 20px;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #FFFFFF;
        }
        .header { 
            background-color: #DC2626; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 18px;
            opacity: 0.95;
            font-weight: 600;
        }
        .content { 
            padding: 20px; 
        }
        .alert-box {
            background-color: #FEE2E2;
            border: 2px solid #FECACA;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            color: #991B1B;
            font-weight: 600;
        }
        .order-info {
            background-color: #FEF2F2;
            border: 1px solid #FECACA;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .order-info h2 {
            color: #DC2626;
            margin: 0 0 5px 0;
            font-size: 20px;
        }
        .order-info p {
            color: #6B7280;
            margin: 5px 0;
            font-size: 14px;
        }
        .section { 
            background-color: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 8px; 
            padding: 15px;
            margin-bottom: 15px;
        }
        .section h3 {
            color: #DC2626;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
        }
        .section-icon {
            width: 16px;
            height: 16px;
            margin-right: 8px;
        }
        .info-row { 
            padding: 6px 0;
            font-size: 14px;
        }
        .info-row:not(:last-child) {
            border-bottom: 1px solid #F3F4F6;
        }
        .info-label { 
            font-weight: 600; 
            color: #6B7280;
            display: inline-block;
            min-width: 80px;
        }
        .info-value { 
            color: #1F2937;
        }
        .item-row { 
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
        }
        .item-name {
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 4px;
        }
        .item-details {
            color: #6B7280;
            font-size: 14px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }
        .summary-label {
            color: #6B7280;
        }
        .summary-value {
            color: #1F2937;
            font-weight: 500;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 16px;
            font-weight: 700;
            color: #DC2626;
            border-top: 2px solid #E5E7EB;
            margin-top: 8px;
        }
        .address-content {
            color: #1F2937;
            font-size: 14px;
            line-height: 1.8;
        }
        .footer { 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center; 
            color: #6B7280; 
            font-size: 13px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 New Order Received!</h1>
            <p>Order #${data.orderNumber}</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                ⚡ ACTION REQUIRED: Please process this order promptly.
            </div>

            <div class="order-info">
                <h2>Order Details</h2>
                <p><strong>Order Date:</strong> ${formattedDate}</p>
                <p><strong>Payment Status:</strong> ${data.paymentStatus}</p>
            </div>
            
            <!-- Customer Information -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                </h3>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${data.customerEmail}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${data.customerName}</span>
                </div>
                ${formattedPhone ? `
                <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${formattedPhone}</span>
                </div>
                ` : ''}
            </div>

            <!-- Shipping Address -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Shipping Address
                </h3>
                <div class="address-content">
                    ${data.shippingAddress.line1}<br>
                    ${data.shippingAddress.line2 ? data.shippingAddress.line2 + '<br>' : ''}
                    ${data.shippingAddress.city}${data.shippingAddress.state ? ', ' + data.shippingAddress.state : ''} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                </div>
            </div>
            
            <!-- Order Items -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Order Items (${data.orderItems.length})
                </h3>
                ${data.orderItems.map(item => `
                    <div class="item-row">
                        <div class="item-name">${item.name}</div>
                        <div class="item-details">
                            Quantity: ${item.quantity} × $${(item.price || 0).toFixed(2)} = $${(item.total || 0).toFixed(2)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Order Summary -->
            <div class="section">
                <h3>
                    <svg class="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Order Summary
                </h3>
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">$${(data.subtotal || 0).toFixed(2)}</span>
                </div>
                ${data.discountAmount && data.discountAmount > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Discount${data.dealCode ? ` (${data.dealCode})` : ''}:</span>
                    <span class="summary-value" style="color: #059669;">-$${data.discountAmount.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span class="summary-label">Shipping:</span>
                    <span class="summary-value">$${(data.shippingCost || 0).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Tax:</span>
                    <span class="summary-value">$${(data.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Total:</span>
                    <span>$${(data.totalAmount || 0).toFixed(2)} ${data.currency || 'USD'}</span>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from your e-commerce system.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateAdminNotificationText(data: AdminNotificationData): string {
    // Format the date to be more human-readable
    const formattedDate = this.formatDate(data.orderDate);
    const formattedPhone = this.formatPhoneNumber(data.customerPhone);
    
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      🔔 NEW ORDER NOTIFICATION 🔔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ ACTION REQUIRED: Please process this order promptly.

Order #${data.orderNumber}
Order Date: ${formattedDate}
Payment Status: ${data.paymentStatus}

─────────────────────────────────────────────
CUSTOMER INFORMATION
─────────────────────────────────────────────
Email: ${data.customerEmail}
Name: ${data.customerName}
${formattedPhone ? `Phone: ${formattedPhone}\n` : ''}
─────────────────────────────────────────────
SHIPPING ADDRESS
─────────────────────────────────────────────
${data.shippingAddress.line1}
${data.shippingAddress.line2 ? data.shippingAddress.line2 + '\n' : ''}${data.shippingAddress.city}${data.shippingAddress.state ? ', ' + data.shippingAddress.state : ''} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

─────────────────────────────────────────────
ORDER ITEMS (${data.orderItems.length})
─────────────────────────────────────────────
${data.orderItems.map(item => 
  `${item.name}
Qty: ${item.quantity} × $${(item.price || 0).toFixed(2)} = $${(item.total || 0).toFixed(2)}`
).join('\n\n')}

─────────────────────────────────────────────
ORDER SUMMARY
─────────────────────────────────────────────
Subtotal:        $${(data.subtotal || 0).toFixed(2)}
${data.discountAmount && data.discountAmount > 0 ? `Discount${data.dealCode ? ` (${data.dealCode})` : ''}:      -$${data.discountAmount.toFixed(2)}\n` : ''}Shipping:        $${(data.shippingCost || 0).toFixed(2)}
Tax:             $${(data.taxAmount || 0).toFixed(2)}
─────────────────────────────────────────────
TOTAL:           $${(data.totalAmount || 0).toFixed(2)} ${data.currency || 'USD'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated notification from your e-commerce system.
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

  private formatPhoneNumber(phoneNumber?: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      // US format: (XXX) XXX-XXXX
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      // US format with country code: +1 (XXX) XXX-XXXX
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length > 10) {
      // International format: +XX XXX XXX XXXX
      return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10, -7)} ${cleaned.slice(-7, -4)} ${cleaned.slice(-4)}`;
    }
    
    // Return original if it doesn't match expected formats
    return phoneNumber;
  }
}

// Export singleton instance
export const azureEmailService = new AzureEmailService();