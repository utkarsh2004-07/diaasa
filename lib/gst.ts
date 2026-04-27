export interface GSTBreakdown {
  basePrice: number;
  gstPercent: number;
  gstAmount: number;
  totalPrice: number;
  cgst: number;
  sgst: number;
  igst: number;
  isInterState: boolean;
}

export function calculateGST(
  price: number,
  gstPercent: number,
  isInterState = false
): GSTBreakdown {
  const gstAmount = (price * gstPercent) / 100;
  const totalPrice = price + gstAmount;

  let cgst = 0, sgst = 0, igst = 0;
  if (isInterState) {
    igst = gstAmount;
  } else {
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
  }

  return {
    basePrice: price,
    gstPercent,
    gstAmount: round2(gstAmount),
    totalPrice: round2(totalPrice),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    isInterState,
  };
}

export interface CartGSTSummary {
  subtotal: number;
  totalGST: number;
  totalWithGST: number;
  cgst: number;
  sgst: number;
  igst: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    gstPercent: number;
    gstAmount: number;
    lineTotal: number;
  }>;
}

export function calculateCartGST(
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    gstPercent: number;
  }>,
  isInterState = false
): CartGSTSummary {
  let subtotal = 0;
  let totalGST = 0;
  let cgst = 0, sgst = 0, igst = 0;

  const breakdown = items.map((item) => {
    const lineBase = item.price * item.quantity;
    const gst = calculateGST(lineBase, item.gstPercent, isInterState);

    subtotal += lineBase;
    totalGST += gst.gstAmount;
    cgst += gst.cgst;
    sgst += gst.sgst;
    igst += gst.igst;

    return {
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      gstPercent: item.gstPercent,
      gstAmount: gst.gstAmount,
      lineTotal: gst.totalPrice,
    };
  });

  return {
    subtotal: round2(subtotal),
    totalGST: round2(totalGST),
    totalWithGST: round2(subtotal + totalGST),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    items: breakdown,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
