import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    let symbol = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      symbol = url.searchParams.get("symbol")?.trim() ?? "";
    }

    if (req.method === "POST") {
      const body = await req.json();
      symbol = body?.symbol?.trim() ?? "";
    }

    if (!symbol) {
      return new Response(
        JSON.stringify({
          error: "Stock symbol is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiKey = Deno.env.get("FINNHUB_API_KEY");

    if (!apiKey) {
      console.error("FINNHUB_API_KEY is not configured.");

      return new Response(
        JSON.stringify({
          error: "Market data service is not configured.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const finnhubUrl =
      `https://finnhub.io/api/v1/quote` +
      `?symbol=${encodeURIComponent(symbol.toUpperCase())}` +
      `&token=${encodeURIComponent(apiKey)}`;

    const response = await fetch(finnhubUrl);

    if (!response.ok) {
      console.error(
        "Finnhub quote request failed:",
        response.status
      );

      return new Response(
        JSON.stringify({
          error: "Market data provider request failed.",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        symbol: symbol.toUpperCase(),
        quote: {
          currentPrice: data.c ?? null,
          change: data.d ?? null,
          percentChange: data.dp ?? null,
          high: data.h ?? null,
          low: data.l ?? null,
          open: data.o ?? null,
          previousClose: data.pc ?? null,
          timestamp: data.t ?? null,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Stock quote error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to retrieve stock quote.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});