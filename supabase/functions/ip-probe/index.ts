// Temporary diagnostic: echoes request headers relevant to client IP. Delete after use.
Deno.serve((req, info) => {
  const h: Record<string, string> = {};
  for (const [k, v] of req.headers) if (/ip|forward|cf-|real|client|via|x-sb|x-envoy/i.test(k)) h[k] = v;
  return new Response(JSON.stringify({ h, remote: (info?.remoteAddr as Deno.NetAddr | undefined)?.hostname ?? null }), { headers: { 'Content-Type': 'application/json' } });
});
