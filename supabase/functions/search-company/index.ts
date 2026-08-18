import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    let query = "";

    // Support GET requests:
    // /search-company?q=AAPL
    if (req.method === "GET") {
      const url = new URL(req.url);
      query = url.searchParams.get("q")?.trim() ?? "";
    }

    // Support POST requests from supabase.functions.invoke()
    if (req.method === "POST") {
      const body = await req.json();
      query = body?.q?.trim() ?? "";
    }

    if (!query) {
      return new Response(
        JSON.stringify({
          error: "Search query is required.",
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
      `https://finnhub.io/api/v1/search` +
      `?q=${encodeURIComponent(query)}` +
      `&exchange=US` +
      `&token=${encodeURIComponent(apiKey)}`;

    const response = await fetch(finnhubUrl);

    if (!response.ok) {
      console.error(
        "Finnhub request failed:",
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

    const results = data.result ?? [];

    // Put an exact ticker match first.
    const normalizedQuery = query.toUpperCase();

    results.sort((a: any, b: any) => {
      const aExact =
        a.symbol?.toUpperCase() === normalizedQuery;

      const bExact =
        b.symbol?.toUpperCase() === normalizedQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return 0;
    });

    return new Response(
      JSON.stringify({
        count: results.length,
        results,
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
    console.error("Company search error:", error);

    return new Response(
      JSON.stringify({
        error: "Unable to search companies.",
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