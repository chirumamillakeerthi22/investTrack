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