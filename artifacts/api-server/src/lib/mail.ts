// backend/lib/mail.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optional helper
export async function sendOrderConfirmation(to: string, orderId: number, total: number) {
  await transporter.sendMail({
    from: `"Yelements" <${process.env.SMTP_USER}>`,
    to,
    subject: `Order Confirmed - #${orderId}`,
    html: `<h2>Thank you! Order #${orderId}</h2><p>Total: ₹${total}</p>`,
  });
}