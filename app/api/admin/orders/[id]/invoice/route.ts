import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateInvoicePDF } from "@/lib/invoice";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.role)) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
        address: true,
      },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);

    const invoiceUrl = await generateInvoicePDF({
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: {
        name: order.user.name || "Customer",
        phone: order.user.phone,
        email: order.user.email || undefined,
      },
      address: order.address
        ? {
            line1: order.address.line1,
            line2: order.address.line2 || undefined,
            city: order.address.city,
            state: order.address.state,
            pincode: order.address.pincode,
            country: order.address.country,
          }
        : { line1: "N/A", city: "N/A", state: "N/A", pincode: "N/A", country: "India" },
      items: order.items.map((i) => ({
        name: i.name,
        variantName: i.variantName,
        quantity: i.quantity,
        price: i.price,
        gstPercent: i.gstPercent,
        gstAmount: i.gstAmount,
        total: i.total,
      })),
      subtotal: order.subtotal,
      gstAmount: order.gstAmount,
      shippingAmount: order.shippingAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      paymentMethod: order.paymentMethod === "COD" ? "Cash on Delivery" : "Online",
      paymentStatus: order.paymentStatus,
      razorpayPaymentId: order.razorpayPaymentId || undefined,
    });

    await prisma.order.update({ where: { id }, data: { invoiceUrl } });

    return successResponse({ invoiceUrl }, "Invoice generated successfully");
  } catch (error) {
    console.error("Invoice generation error:", error);
    return serverErrorResponse();
  }
}
