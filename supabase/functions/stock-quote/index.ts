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

    console.log(
      `Finnhub quote response for ${symbol}:`,
      data
    );

    const quote = {
      currentPrice: Number(data.c),
      change: Number(data.d),
      percentChange: Number(data.dp),
      high: Number(data.h),
      low: Number(data.l),
      open: Number(data.o),
      previousClose: Number(data.pc),
      timestamp: data.t ?? null,
    };

    const requiredValues = [
      quote.currentPrice,
      quote.change,
      quote.percentChange,
      quote.high,
      quote.low,
      quote.open,
      quote.previousClose,
    ];

    if (
      requiredValues.some(
        (value) => !Number.isFinite(value)
      )
    ) {
      console.error(
        "Invalid Finnhub quote:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "Current market data is unavailable.",
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

    return new Response(
      JSON.stringify({
        symbol: symbol.toUpperCase(),
        quote,
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