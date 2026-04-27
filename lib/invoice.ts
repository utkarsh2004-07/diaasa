// Invoice generates PDF as Buffer in memory — streamed directly to browser
// No file saving on server, no font path issues

export interface InvoiceData {
  orderNumber: string;
  orderDate: Date;
  customer: { name: string; phone: string; email?: string };
  address: { line1: string; line2?: string; city: string; state: string; pincode: string; country: string };
  items: Array<{ name: string; variantName: string; quantity: number; price: number; gstPercent: number; gstAmount: number; total: number }>;
  subtotal: number;
  gstAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayPaymentId?: string;
}

export async function generateInvoiceBuffer(data: InvoiceData): Promise<Buffer> {
  const PDFDocument = require("pdfkit");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Header ──
    doc.fillColor("#1a1714").fontSize(24).font("Helvetica-Bold").text("LUXE STORE", 50, 50);
    doc.fontSize(10).font("Helvetica").fillColor("#8a847d").text("Premium Beauty & Skincare", 50, 78);

    doc.fillColor("#e08a28").fontSize(20).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });
    doc.fillColor("#8a847d").fontSize(10).font("Helvetica")
      .text(`#${data.orderNumber}`, 400, 75, { align: "right" })
      .text(`Date: ${data.orderDate.toLocaleDateString("en-IN")}`, 400, 90, { align: "right" });

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor("#e5e1dc").stroke();

    // ── Bill To ──
    doc.fillColor("#8a847d").fontSize(9).font("Helvetica-Bold").text("BILL TO", 50, 130);
    doc.fillColor("#1a1714").fontSize(11).font("Helvetica-Bold").text(data.customer.name, 50, 145);
    doc.fillColor("#413d38").fontSize(10).font("Helvetica").text(data.address.line1, 50, 162);
    if (data.address.line2) doc.text(data.address.line2, 50, 177);
    const addrY = data.address.line2 ? 192 : 177;
    doc.text(`${data.address.city}, ${data.address.state} - ${data.address.pincode}`, 50, addrY);
    doc.text(`Phone: ${data.customer.phone}`, 50, addrY + 15);
    if (data.customer.email) doc.text(`Email: ${data.customer.email}`, 50, addrY + 30);

    // ── Payment Info ──
    doc.fillColor("#8a847d").fontSize(9).font("Helvetica-Bold").text("PAYMENT INFO", 350, 130);
    doc.fillColor("#1a1714").fontSize(10).font("Helvetica")
      .text(`Method: ${data.paymentMethod}`, 350, 145)
      .text(`Status: ${data.paymentStatus}`, 350, 162);
    if (data.razorpayPaymentId) {
      doc.text(`Payment ID:`, 350, 177).text(data.razorpayPaymentId, 350, 192, { width: 195 });
    }

    // ── Items Table ──
    const tableTop = 260;
    doc.rect(50, tableTop, 495, 24).fill("#f5f3f0");
    doc.fillColor("#413d38").fontSize(9).font("Helvetica-Bold")
      .text("ITEM", 60, tableTop + 8)
      .text("QTY", 310, tableTop + 8)
      .text("PRICE", 355, tableTop + 8)
      .text("GST", 415, tableTop + 8)
      .text("TOTAL", 470, tableTop + 8);

    let y = tableTop + 34;
    data.items.forEach((item, i) => {
      if (i % 2 === 0) doc.rect(50, y - 5, 495, 28).fill("#fdf9f3");
      doc.fillColor("#1a1714").fontSize(9).font("Helvetica")
        .text(`${item.name} (${item.variantName})`, 60, y, { width: 240 })
        .text(String(item.quantity), 310, y)
        .text(`Rs.${item.price.toFixed(2)}`, 355, y)
        .text(`Rs.${item.gstAmount.toFixed(2)} (${item.gstPercent}%)`, 415, y)
        .text(`Rs.${item.total.toFixed(2)}`, 470, y);
      y += 28;
    });

    // ── Totals ──
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).strokeColor("#e5e1dc").stroke();
    y += 10;

    const addRow = (label: string, value: string, color = "#1a1714") => {
      doc.fillColor("#8a847d").fontSize(9).font("Helvetica").text(label, 350, y);
      doc.fillColor(color).text(value, 470, y, { align: "right", width: 75 });
      y += 18;
    };

    addRow("Subtotal:", `Rs.${data.subtotal.toFixed(2)}`);
    addRow("GST:", `Rs.${data.gstAmount.toFixed(2)}`);
    addRow("Shipping:", data.shippingAmount === 0 ? "FREE" : `Rs.${data.shippingAmount.toFixed(2)}`);
    if (data.discountAmount > 0) addRow("Discount:", `-Rs.${data.discountAmount.toFixed(2)}`, "#16a34a");

    y += 4;
    doc.rect(350, y, 195, 28).fill("#1a1714");
    doc.fillColor("white").fontSize(11).font("Helvetica-Bold")
      .text("TOTAL:", 360, y + 8)
      .text(`Rs.${data.total.toFixed(2)}`, 420, y + 8, { align: "right", width: 115 });

    // ── Footer ──
    doc.fillColor("#cac5be").fontSize(8).font("Helvetica")
      .text("Thank you for shopping with Luxe Store!", 50, 750, { align: "center", width: 495 })
      .text("This is a computer-generated invoice and does not require a signature.", 50, 763, { align: "center", width: 495 });

    doc.end();
  });
}

// Keep old signature for backward compat — now returns a dummy path (not used)
export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  // Just return a marker — actual PDF is streamed via /api/invoice/[orderId]
  return `/api/invoice/${data.orderNumber}`;
}
