import { supabase } from './supabase';

export async function searchCompanies(query) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const { data, error } = await supabase.functions.invoke(
    'search-company',
    {
      body: {
        q: trimmedQuery,
      },
    }
  );

  if (error) {
    console.error('Company search failed:', error);
    throw new Error('Unable to search companies.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.results ?? [];
}

export async function getStockQuote(symbol) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error('Stock symbol is required.');
  }

  const { data, error } = await supabase.functions.invoke(
    'stock-quote',
    {
      body: {
        symbol: normalizedSymbol,
      },
    }
  );

  if (error) {
    console.error('Stock quote failed:', error);
    throw new Error('Unable to load stock quote.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.quote) {
    throw new Error('No stock quote was returned.');
  }

  return data.quote;
}

export async function getStockHistory(symbol) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error('Stock symbol is required.');
  }

  const { data, error } = await supabase.functions.invoke(
    'stock-history',
    {
      body: {
        symbol: normalizedSymbol,
      },
    }
  );

  if (error) {
    console.error('Stock history failed:', error);
    throw new Error('Unable to load historical stock data.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.history ?? [];
}