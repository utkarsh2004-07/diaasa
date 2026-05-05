import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const STORE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Diaasa Store";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f3f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1a1714;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:300;letter-spacing:3px;">${STORE_NAME.toUpperCase()}</h1>
      <p style="margin:4px 0 0;color:#8a847d;font-size:11px;letter-spacing:1px;">PREMIUM BEAUTY & SKINCARE</p>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="background:#f5f3f0;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#8a847d;font-size:12px;">© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      <p style="margin:6px 0 0;color:#8a847d;font-size:12px;">
        <a href="${APP_URL}" style="color:#e08a28;text-decoration:none;">Visit Store</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmedEmail(params: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: string;
  total: number;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; total: number }>;
}) {
  if (!process.env.SMTP_USER) return; // Skip if not configured

  const itemRows = params.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#413d38;font-size:14px;">${i.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#8a847d;font-size:14px;text-align:center;">×${i.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f0ede8;color:#1a1714;font-size:14px;text-align:right;font-weight:600;">₹${i.total.toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:#f0fdf4;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">✓</span>
      </div>
      <h2 style="margin:0;color:#1a1714;font-size:22px;font-weight:300;">Order Confirmed!</h2>
      <p style="margin:8px 0 0;color:#8a847d;font-size:14px;">Hi ${params.name}, your order has been placed successfully.</p>
    </div>

    <div style="background:#f5f3f0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Order Number</p>
          <p style="margin:4px 0 0;color:#1a1714;font-size:16px;font-weight:600;">${params.orderNumber}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Payment</p>
          <p style="margin:4px 0 0;color:#1a1714;font-size:14px;font-weight:600;">${params.paymentMethod}</p>
        </div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr>
          <th style="text-align:left;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #f0ede8;">Item</th>
          <th style="text-align:center;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #f0ede8;">Qty</th>
          <th style="text-align:right;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;padding-bottom:10px;border-bottom:2px solid #f0ede8;">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:14px 0 0;color:#1a1714;font-size:16px;font-weight:700;">Total</td>
          <td style="padding:14px 0 0;color:#e08a28;font-size:18px;font-weight:700;text-align:right;">₹${params.total.toLocaleString("en-IN")}</td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align:center;margin-top:28px;">
      <a href="${APP_URL}/orders/${params.orderId}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">
        Track Your Order
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"${STORE_NAME}" <${process.env.SMTP_USER}>`,
    to: params.to,
    subject: `Order Confirmed — ${params.orderNumber} | ${STORE_NAME}`,
    html: baseTemplate(content),
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  name: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  trackingUrl?: string;
}) {
  if (!process.env.SMTP_USER) return;

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:#eff6ff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🚚</span>
      </div>
      <h2 style="margin:0;color:#1a1714;font-size:22px;font-weight:300;">Your Order is on the Way!</h2>
      <p style="margin:8px 0 0;color:#8a847d;font-size:14px;">Hi ${params.name}, your order has been shipped.</p>
    </div>

    <div style="background:#f5f3f0;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Order Number</p>
      <p style="margin:4px 0 0;color:#1a1714;font-size:16px;font-weight:600;">${params.orderNumber}</p>
      ${params.trackingNumber ? `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e1dc;">
        <p style="margin:0;color:#8a847d;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Tracking Number</p>
        <p style="margin:4px 0 0;color:#1a1714;font-size:14px;font-weight:600;">${params.trackingNumber}</p>
      </div>` : ""}
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${params.trackingUrl || `${APP_URL}/orders/${params.orderId}`}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:500;letter-spacing:0.5px;">
        ${params.trackingUrl ? "Track Shipment" : "View Order"}
      </a>
    </div>
  `;

  await transporter.sendMail({
    from: `"${STORE_NAME}" <${process.env.SMTP_USER}>`,
    to: params.to,
    subject: `Your Order Has Been Shipped — ${params.orderNumber} | ${STORE_NAME}`,
    html: baseTemplate(content),
  });
}
