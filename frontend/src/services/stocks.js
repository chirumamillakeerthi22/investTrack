import { supabase } from './supabase';

export async function ensureStock(company) {
  const symbol = (
    company.displaySymbol ||
    company.symbol ||
    ''
  ).trim().toUpperCase();

  const companyName = (
    company.description ||
    company.companyName ||
    symbol
  ).trim();

  const exchange = (
    company.exchange ||
    ''
  ).trim();

  if (!symbol) {
    throw new Error('Company symbol is required.');
  }

  const { data, error } = await supabase.rpc(
    'ensure_stock',
    {
      p_symbol: symbol,
      p_company_name: companyName,
      p_exchange: exchange || null,
    }
  );

  if (error) {
    console.error('Ensure stock failed:', error);
    throw new Error(
      error.message || 'Unable to save company.'
    );
  }

  if (!data) {
    throw new Error('Stock was not returned.');
  }

  return data;
}
export async function addToWatchlist(stockId) {
  const { error } =
    await supabase
      .from('watchlist')
      .insert({
        stock_id: stockId,
      });

  if (error) {
    throw error;
  }
}

export async function removeFromWatchlist(id) {
  const { error } =
    await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

  if (error) {
    throw error;
  }
}

export async function addToWishlist(stockId) {
  const { error } =
    await supabase
      .from('wishlist')
      .insert({
        stock_id: stockId,
      });

  if (error) {
    throw error;
  }
}

export async function removeFromWishlist(id) {
  const { error } =
    await supabase
      .from('wishlist')
      .delete()
      .eq('id', id);

  if (error) {
    throw error;
  }
}