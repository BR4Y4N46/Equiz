export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

// Redirect to the actual register endpoint
export async function POST(req: NextRequest) {
  const body = await req?.json();
  const url = new URL('/api/auth/register', req?.url);
  return fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cookie': req?.headers?.get?.('cookie') ?? '' },
    body: JSON.stringify(body),
  }).then(async (r) => {
    const data = await r?.json();
    const response = NextResponse.json(data, { status: r?.status });
    // Forward cookies
    const setCookie = r?.headers?.get?.('set-cookie');
    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }
    return response;
  });
}
