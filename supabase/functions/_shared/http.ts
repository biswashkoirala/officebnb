// Small helpers shared by the browser-facing Edge Functions: CORS, JSON
// responses, the service-role Supabase client and "who is calling".
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const admin: SupabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Comma-separated list of sites allowed to call these functions from a
// browser, e.g. "https://yourdomain.com.au,http://localhost:5173". If unset,
// any origin is allowed (fine for local dev; set it in production). Every
// function still requires a valid Supabase session either way.
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  let allow = '*';
  if (allowedOrigins.length > 0) {
    allow = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  }
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export async function requireUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new HttpError(401, 'Please log in again.');
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) throw new HttpError(401, 'Your session has expired — please log in again.');
  return data.user;
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Invalid request.');
  }
}

/**
 * Wraps a handler with CORS preflight handling and uniform error responses.
 * HttpErrors surface their message; anything else is logged and returned
 * as a generic 500 so internals never leak to the browser.
 */
export function serve(name: string, handler: (req: Request, origin: string | null) => Promise<Response>) {
  Deno.serve(async (req) => {
    const origin = req.headers.get('origin');
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
    try {
      return await handler(req, origin);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message }, err.status, origin);
      console.error(`${name} error`, err);
      return json({ error: 'Something went wrong. Please try again.' }, 500, origin);
    }
  });
}

/** Site URL used for Stripe redirects and links in emails. */
export function siteUrl(): string {
  const url = Deno.env.get('SITE_URL');
  if (!url) throw new Error('SITE_URL secret is not set');
  return url.replace(/\/$/, '');
}
