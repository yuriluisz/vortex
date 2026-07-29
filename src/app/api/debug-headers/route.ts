import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return Response.json({
    receivedHeaders: headers,
    xVortexHost: request.headers.get("x-vortex-host"),
    xForwardedHost: request.headers.get("x-forwarded-host"),
    host: request.headers.get("host"),
    url: request.url,
  });
}
