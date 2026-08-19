import "@supabase/functions-js/edge-runtime.d.ts";

import {
  createClient,
} from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "POST request is required.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const symbol =
      body?.symbol?.trim()?.toUpperCase() ?? "";

    const companyName =
      body?.companyName?.trim() ?? "";

    const exchange =
      body?.exchange?.trim() ?? "";

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

    if (!companyName) {
      return new Response(
        JSON.stringify({
          error: "Company name is required.",
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

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Supabase environment variables are not configured."
      );

      return new Response(
        JSON.stringify({
          error:
            "Stock service is not configured.",
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

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    // -----------------------------------------------
    // Check whether the stock already exists
    // -----------------------------------------------

    const {
      data: existingStock,
      error: lookupError,
    } = await supabaseAdmin
      .from("stocks")
      .select(
        "id, symbol, company_name, exchange"
      )
      .eq("symbol", symbol)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "Stock lookup failed:",
        lookupError
      );

      return new Response(
        JSON.stringify({
          error:
            "Unable to check stock database.",
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

    // -----------------------------------------------
    // Existing stock
    // -----------------------------------------------

    if (existingStock) {
      return new Response(
        JSON.stringify({
          stock: existingStock,
          created: false,
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

    // -----------------------------------------------
    // Create stock
    // -----------------------------------------------

    const {
      data: newStock,
      error: insertError,
    } = await supabaseAdmin
      .from("stocks")
      .insert({
        symbol,
        company_name: companyName,
        exchange: exchange || null,
      })
      .select(
        "id, symbol, company_name, exchange"
      )
      .single();

    if (insertError) {
      console.error(
        "Stock creation failed:",
        insertError
      );

      // Another request may have created the
      // same stock at the same time.
      if (
        insertError.code === "23505"
      ) {
        const {
          data: concurrentStock,
          error:
            concurrentLookupError,
        } = await supabaseAdmin
          .from("stocks")
          .select(
            "id, symbol, company_name, exchange"
          )
          .eq("symbol", symbol)
          .single();

        if (
          concurrentLookupError ||
          !concurrentStock
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Unable to retrieve the stock after creation.",
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                "Content-Type":
                  "application/json",
              },
            }
          );
        }

        return new Response(
          JSON.stringify({
            stock: concurrentStock,
            created: false,
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type":
                "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error:
            "Unable to create stock record.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        stock: newStock,
        created: true,
      }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "Ensure stock error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Unable to ensure stock record.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});