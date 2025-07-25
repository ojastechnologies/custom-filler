import { EmailClient } from "@azure/communication-email";
import { Order, OrderItem } from "./ordersService";

export interface EmailContent {
  subject: string;
  plainText?: string;
  html?: string;
  orderDetails? : Order;
  orderItems?: OrderItem[];
}

export interface EmailAttachment {
  name: string;
  contentType: string;
  contentInBase64: string;
}

export interface EmailRequest {
  senderAddress?: string;
  recipientAddress?: string;
  content: EmailContent;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export class EmailService {
  private client: EmailClient;
  private defaultSender: string;
  private defaultRecipient: string;

  constructor() {
    const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
    
    if (!connectionString) {
      throw new Error("Azure Communication Services connection string is not configured");
    }
    
    this.client = new EmailClient(connectionString);
    this.defaultSender = process.env.AZURE_EMAIL_SENDER_ADDRESS || "";
    this.defaultRecipient = process.env.AZURE_EMAIL_RECIPIENT_ADDRESS || "";
  }

  async sendEmail(request: EmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { senderAddress, recipientAddress, content, cc, bcc, attachments, replyTo } = request;
      
      const message = {
        senderAddress: senderAddress || this.defaultSender,
        content: content.html
          ? {
              subject: content.subject,
              html: content.html,
              plainText: content.plainText ?? ""
            }
          : {
              subject: content.subject,
              plainText: content.plainText ?? ""
            },
        recipients: {
          to: [{ address: recipientAddress || this.defaultRecipient }],
          cc: cc?.map(address => ({ address })),
          bcc: bcc?.map(address => ({ address })),
        },
        attachments: attachments,
        replyTo: replyTo ? [{ address: replyTo }] : undefined,
      };

      const poller = await this.client.beginSend(message);
      const response = await poller.pollUntilDone();

      return {
        success: true,
        messageId: response.id
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  // Helper method for contact form submissions
  async sendContactFormEmail(formData: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { name, email, phone, company, message } = formData;
    
    const subject = `New Contact Form Submission from ${name}`;
    
    const htmlContent = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
      ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;
    
    const plainTextContent = `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      ${phone ? `Phone: ${phone}\n` : ''}
      ${company ? `Company: ${company}\n` : ''}
      Message:
      ${message}
    `;
    
    return this.sendEmail({
      content: {
        subject,
        plainText: plainTextContent,
        html: htmlContent
      },
      replyTo: email // Set reply-to as the submitter's email
    });
  }
}

// Create a singleton instance
export const emailService = new EmailService();
