import emailjs from '@emailjs/browser';

export interface EmailParams {
  to_email: string;
  order_number: string;
  session_id: string;
  reply_to: string;
  customer_name?: string;
  order_date?: string;
  order_items?: string;
  total_amount?: string;
  shipping_address?: string;
  pdf_link?: string; // New field for PDF link
}

export const sendOrderConfirmationEmail = async ({
  to_email,
  order_number,
  session_id,
  reply_to,
  customer_name = 'Customer',
  order_date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  order_items = 'N/A',
  total_amount = 'N/A',
//   shipping_address = 'N/A',
  pdf_link = 'N/A',
}: EmailParams): Promise<{ success: boolean; error?: string }> => {
  try {
    debugger;
    console.log('Initializing EmailJS with User ID:', process.env.NEXT_PUBLIC_EMAILJS_USER_ID);
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID!);

    const templateParams = {
      to_email,
      order_number,
      session_id,
      reply_to,
      customer_name,
      order_date,
      order_items,
      total_amount,
    //   shipping_address,
      pdf_link,
    };

    console.log('Sending email with params:', templateParams);
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams
    );

    console.log('✅ Email sent successfully:', response.status, response.text);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};