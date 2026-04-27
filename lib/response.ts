import { NextResponse } from "next/server";

export function successResponse<T>(data: T, message = "", status = 200) {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export function unauthorizedResponse(message = "Unauthorized") {
  return errorResponse("UNAUTHORIZED", message, 401);
}

export function forbiddenResponse(message = "Forbidden") {
  return errorResponse("FORBIDDEN", message, 403);
}

export function notFoundResponse(message = "Not found") {
  return errorResponse("NOT_FOUND", message, 404);
}

export function rateLimitResponse() {
  return errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", 429);
}

export function serverErrorResponse(message = "Internal server error") {
  return errorResponse("SERVER_ERROR", message, 500);
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
