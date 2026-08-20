import { supabase } from './supabase';

async function invoke(functionName, body) {
  const { data, error } =
    await supabase.functions.invoke(
      functionName,
      { body }
    );

  if (error) {
    console.error(
      `${functionName} failed:`,
      error
    );

    throw new Error(
      error.message ||
      `Unable to call ${functionName}.`
    );
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function searchCompanies(query) {
  const q = query.trim();

  if (!q) {
    return [];
  }

  const data = await invoke(
    'search-company',
    { q }
  );

  return data?.results ?? [];
}

export async function getStockQuote(symbol) {
  const normalized =
    symbol.trim().toUpperCase();

  if (!normalized) {
    throw new Error(
      'Stock symbol is required.'
    );
  }

  const data = await invoke(
    'stock-quote',
    { symbol: normalized }
  );

  if (!data?.quote) {
    throw new Error(
      'No stock quote was returned.'
    );
  }

  return data.quote;
}

export async function getStockHistory(symbol) {
  const normalized =
    symbol.trim().toUpperCase();

  if (!normalized) {
    throw new Error(
      'Stock symbol is required.'
    );
  }

  const data = await invoke(
    'stock-history',
    { symbol: normalized }
  );

  return data?.history ?? [];
}