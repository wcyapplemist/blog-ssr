import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "official-joke-api.appspot.com",
  "dog.ceo",
  "api.github.com",
  "catfact.ninja",
  "ipapi.co",
  "api.adviceslip.com",
  "uselessfacts.jsph.pl",
];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const targetUrl = request.nextUrl.searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  if (!isAllowed(targetUrl)) {
    return NextResponse.json(
      { error: "Domain not in allowed list" },
      { status: 403 }
    );
  }

  try {
    const start = Date.now();
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "MyBlog-APIPlayground/1.0",
        Accept: "application/json",
      },
    });
    const elapsed = Date.now() - start;
    const text = await res.text();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      elapsed,
      data: json,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Request failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
