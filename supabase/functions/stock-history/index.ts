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

    const apiKey = Deno.env.get("TWELVE_DATA_API_KEY");

    if (!apiKey) {
      console.error(
        "TWELVE_DATA_API_KEY is not configured."
      );

      return new Response(
        JSON.stringify({
          error: "Historical market data service is not configured.",
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

    const normalizedSymbol = symbol.toUpperCase();

    const twelveDataUrl =
      "https://api.twelvedata.com/time_series" +
      `?symbol=${encodeURIComponent(normalizedSymbol)}` +
      "&interval=1day" +
      "&outputsize=1300" +
      "&format=JSON" +
      `&apikey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(twelveDataUrl);

    if (!response.ok) {
      console.error(
        "Twelve Data request failed:",
        response.status
      );

      return new Response(
        JSON.stringify({
          error: "Historical market data provider request failed.",
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

    if (data.status === "error") {
      console.error(
        "Twelve Data returned an error:",
        data.message
      );

      return new Response(
        JSON.stringify({
          error:
            data.message ||
            "Unable to retrieve historical market data.",
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

    const values = data.values ?? [];

    if (values.length === 0) {
      return new Response(
        JSON.stringify({
          symbol: normalizedSymbol,
          history: [],
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const history = values
      .map((item: any) => ({
        date: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume:
          item.volume !== undefined
            ? Number(item.volume)
            : null,
      }))
      .filter(
        (item: any) =>
          item.date &&
          Number.isFinite(item.close)
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

    return new Response(
      JSON.stringify({
        symbol: normalizedSymbol,
        history,
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
    console.error(
      "Stock history error:",
      error
    );

    return new Response(
      JSON.stringify({
        error: "Unable to retrieve historical stock data.",
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