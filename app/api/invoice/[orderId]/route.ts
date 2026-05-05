import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { generateInvoiceBuffer } from "@/lib/invoice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { orderId } = await params;

    // Allow admin or the order owner
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.role);
    const order = await prisma.order.findFirst({
      where: isAdmin ? { id: orderId } : { id: orderId, userId: session.userId },
      include: { items: true, user: true, address: true },
    });

    if (!order) return new NextResponse("Order not found", { status: 404 });

    const buffer = await generateInvoiceBuffer({
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

    // Stream PDF directly to browser — saves to user's PC, nothing stored on server
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("Invoice download error:", error);
    return new NextResponse("Failed to generate invoice", { status: 500 });
  }
}
