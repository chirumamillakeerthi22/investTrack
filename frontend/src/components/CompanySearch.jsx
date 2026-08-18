import { useState } from 'react';

import { searchCompanies } from '../services/marketData';

function CompanySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError('Enter a company name or ticker.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const companies = await searchCompanies(trimmedQuery);

      setResults(companies);

      if (companies.length === 0) {
        setError('No companies found.');
      }
    } catch (err) {
      console.error('Company search failed:', err);

      setError(
        err.message || 'Unable to search companies.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Search Companies</h2>

      <form onSubmit={handleSearch}>
        <input
          type="search"
          placeholder="Search company or ticker..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p>{error}</p>}

      {results.length > 0 && (
        <div>
          <h3>Search Results</h3>

          <ul>
            {results.map((company) => (
              <li
                key={`${company.symbol}-${company.displaySymbol}`}
              >
                <strong>
                  {company.displaySymbol || company.symbol}
                </strong>

                {' — '}

                {company.description}

                {company.type && ` (${company.type})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default CompanySearch;