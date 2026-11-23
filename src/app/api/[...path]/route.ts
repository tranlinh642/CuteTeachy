import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const FORWARDED_REQ_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
  'user-agent',
  'x-cron-secret',
  'x-forwarded-for',
];

const FORWARDED_RES_HEADERS = [
  'cache-control',
  'content-type',
  'etag',
  'location',
  'retry-after',
  'vary',
];

async function proxyRequest(req: NextRequest, context: RouteContext): Promise<Response> {
  const beBaseUrl = (process.env.BE_INTERNAL_URL || 'http://localhost:4000').replace(/\/+$/, '');
  const proxySecret = process.env.INTERNAL_PROXY_SECRET || '';
  const { path } = await context.params;
  const targetPath = path.join('/');
  const search = req.nextUrl.search || '';
  const targetUrl = `${beBaseUrl}/${targetPath}${search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQ_HEADERS) {
    const value = req.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  if (proxySecret) {
    headers.set('x-internal-proxy-secret', proxySecret);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

  const upstreamRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
    redirect: 'manual',
    cache: 'no-store',
  });

  const resHeaders = new Headers();
  for (const name of FORWARDED_RES_HEADERS) {
    const value = upstreamRes.headers.get(name);
    if (value) {
      resHeaders.set(name, value);
    }
  }

  if (
    upstreamRes.status === 204 ||
    upstreamRes.status === 205 ||
    upstreamRes.status === 304 ||
    (upstreamRes.status >= 300 && upstreamRes.status < 400)
  ) {
    return new Response(null, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  }

  const resBody = await upstreamRes.arrayBuffer();
  return new Response(resBody, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
export const HEAD = proxyRequest;
