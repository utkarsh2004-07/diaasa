import { NextRequest } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getServerSession } from "@/lib/auth";
import { successResponse, serverErrorResponse, unauthorizedResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "diaasa/products";

    if (!file) return serverErrorResponse();

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ success: false, error: { message: "File too large. Max 5MB." } }), { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, folder);

    return successResponse({ url }, "Uploaded successfully");
  } catch (error) {
    console.error("Upload error:", error);
    return serverErrorResponse();
  }
}
