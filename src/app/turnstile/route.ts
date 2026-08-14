import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get("theme") || "dark";
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return new NextResponse("Missing SiteKey", { status: 500 });
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Security Check</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    .cf-turnstile {
      min-height: 65px;
    }
  </style>
</head>
<body>
  <div 
    class="cf-turnstile" 
    data-sitekey="${siteKey}"
    data-theme="${theme}"
    data-callback="onTurnstileSuccess"
  ></div>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script>
    window.onTurnstileSuccess = function(token) {
      window.parent.postMessage({ type: 'TURNSTILE_SUCCESS', token: token }, '*');
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
