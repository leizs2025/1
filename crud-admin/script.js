export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const GAS_URL = "https://script.google.com/macros/s/你的GAS_ID/exec";

    let proxyUrl = GAS_URL;
    if (url.search) proxyUrl += url.search;

    const init = {
      method: request.method,
      headers: request.headers,
    };

    if (request.method !== "GET") {
      init.body = await request.text();
    }

    try {
      const resp = await fetch(proxyUrl, init);
      const text = await resp.text();
      return new Response(text, {
        status: resp.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.toString() }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
}
