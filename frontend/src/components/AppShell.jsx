import { useEffect, useRef, useState } from 'react';
import {
    NavLink,
    Outlet,
    useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/auth';
import {
    searchCompanies,
} from '../services/marketData';
import { supabase } from '../services/supabase';

function AppShell() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const searchContainerRef = useRef(null);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] =
        useState([]);

    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [error, setError] = useState('');
    const [isSearchOpen, setIsSearchOpen] =
        useState(false);

    const [highlightedIndex, setHighlightedIndex] =
        useState(-1);

    const [isProfileOpen, setIsProfileOpen] =
        useState(false);

    const navigationItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
        },
        {
            label: 'Portfolio',
            path: '/portfolio',
        },
        {
            label: 'My Holdings',
            path: '/holdings',
        },
        {
            label: 'Wishlist',
            path: '/wishlist',
        },
        {
            label: 'Watchlist',
            path: '/watchlist',
        },
        {
            label: 'Top Companies',
            path: '/top-companies',
        },
        {
            label: 'Feedback',
            path: '/feedback',
        },
    ];

    // --------------------------------------------------
    // Load recent searches
    // --------------------------------------------------

    useEffect(() => {
        async function loadRecentSearches() {
            if (!user) {
                setRecentSearches([]);
                return;
            }

            setHistoryLoading(true);

            const { data, error: historyError } =
                await supabase
                    .from('search_history')
                    .select(
                        'id, symbol, company_name, searched_at'
                    )
                    .eq('user_id', user.id)
                    .order('searched_at', {
                        ascending: false,
                    })
                    .limit(5);

            if (historyError) {
                console.error(
                    'Search history query failed:',
                    historyError
                );

                setRecentSearches([]);
            } else {
                setRecentSearches(data ?? []);
            }

            setHistoryLoading(false);
        }

        loadRecentSearches();
    }, [user]);

    async function handleLogout() {
        try {
            await signOut();

            setIsProfileOpen(false);

            navigate('/login', {
                replace: true,
            });
        } catch (error) {
            console.error(
                'Logout failed:',
                error
            );

            setError(
                error.message ||
                'Unable to sign out.'
            );
        }
    }

    // --------------------------------------------------
    // Close search when clicking outside
    // --------------------------------------------------

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(
                    event.target
                )
            ) {
                setIsSearchOpen(false);
                setHighlightedIndex(-1);
            }
        }

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };
    }, []);

    // --------------------------------------------------
    // Live autocomplete
    // --------------------------------------------------

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setResults([]);
            setError('');
            setLoading(false);
            setHighlightedIndex(-1);

            return undefined;
        }

        setLoading(true);
        setError('');
        setHighlightedIndex(-1);

        const timeoutId = setTimeout(
            async () => {
                try {
                    const companies =
                        await searchCompanies(
                            trimmedQuery
                        );

                    setResults(
                        companies.slice(0, 8)
                    );

                    if (companies.length === 0) {
                        setError(
                            'No companies found.'
                        );
                    }
                } catch (err) {
                    console.error(
                        'Autocomplete search failed:',
                        err
                    );

                    setResults([]);
                    setError(
                        err.message ||
                        'Unable to search companies.'
                    );
                } finally {
                    setLoading(false);
                }
            },
            300
        );

        return () => {
            clearTimeout(timeoutId);
        };
    }, [query]);

    // --------------------------------------------------
    // Save search history
    // --------------------------------------------------

    async function saveSearchHistory(
        company
    ) {
        if (!user) {
            return;
        }

        const symbol =
            company.displaySymbol ||
            company.symbol;

        const companyName =
            company.description ||
            symbol;

        // Remove existing entry for this user/symbol
        await supabase
            .from('search_history')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol);

        // Insert the search again so it moves to top
        const { data, error: historyError } =
            await supabase
                .from('search_history')
                .insert({
                    user_id: user.id,
                    symbol,
                    company_name: companyName,
                })
                .select(
                    'id, symbol, company_name, searched_at'
                )
                .single();

        if (historyError) {
            console.error(
                'Saving search history failed:',
                historyError
            );

            return;
        }

        setRecentSearches((current) => {
            const filtered = current.filter(
                (item) =>
                    item.symbol !== symbol
            );

            return [
                data,
                ...filtered,
            ].slice(0, 5);
        });
    }

    async function handleDeleteRecentSearch(
        event,
        searchId
    ) {
        event.stopPropagation();

        const { error: deleteError } =
            await supabase
                .from('search_history')
                .delete()
                .eq('id', searchId)
                .eq('user_id', user.id);

        if (deleteError) {
            console.error(
                'Deleting search history failed:',
                deleteError
            );

            return;
        }

        setRecentSearches((current) =>
            current.filter(
                (item) => item.id !== searchId
            )
        );
    }

    // --------------------------------------------------
    // Select company
    // --------------------------------------------------

    async function handleCompanySelect(company) {
        const symbol =
            company.displaySymbol ||
            company.symbol;

        if (!symbol) {
            return;
        }

        await saveSearchHistory(company);

        setQuery('');
        setResults([]);
        setError('');
        setIsSearchOpen(false);
        setHighlightedIndex(-1);

        navigate(
            `/company/${encodeURIComponent(symbol)}`,
            {
                state: {
                    company: {
                        symbol,
                        companyName:
                            company.description ||
                            symbol,
                        exchange:
                            company.exchange ||
                            '',
                        type:
                            company.type ||
                            '',
                    },
                },
            }
        );
    }

    // --------------------------------------------------
    // Keyboard navigation
    // --------------------------------------------------

    function handleSearchKeyDown(event) {
        const items =
            query.trim()
                ? results
                : recentSearches;

        if (!isSearchOpen || items.length === 0) {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
            }

            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();

            setHighlightedIndex(
                (current) =>
                    current < items.length - 1
                        ? current + 1
                        : 0
            );
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();

            setHighlightedIndex(
                (current) =>
                    current > 0
                        ? current - 1
                        : items.length - 1
            );
        }

        if (event.key === 'Enter') {
            event.preventDefault();

            if (
                highlightedIndex >= 0 &&
                highlightedIndex < items.length
            ) {
                const selected =
                    items[highlightedIndex];

                if (query.trim()) {
                    handleCompanySelect(
                        selected
                    );
                } else {
                    handleRecentSearchSelect(
                        selected
                    );
                }
            }
        }

        if (event.key === 'Escape') {
            event.preventDefault();

            setIsSearchOpen(false);
            setHighlightedIndex(-1);
        }
    }

    // --------------------------------------------------
    // Select recent search
    // --------------------------------------------------

    async function handleRecentSearchSelect(recent) {
        const company = {
            symbol: recent.symbol,
            displaySymbol: recent.symbol,
            description: recent.company_name,
            exchange: recent.exchange || '',
        };

        await handleCompanySelect(company);
    }

    // --------------------------------------------------
    // Search focus
    // --------------------------------------------------

    function handleSearchFocus() {
        setIsSearchOpen(true);
        setHighlightedIndex(-1);
    }

    // --------------------------------------------------
    // Clear search
    // --------------------------------------------------

    function handleClearSearch() {
        setQuery('');
        setResults([]);
        setError('');
        setHighlightedIndex(-1);
        setIsSearchOpen(true);
    }

    return (
        <div className="app-shell">
            {/* Top Navigation */}

            <header className="app-topbar">
                <div className="app-logo">
                    invest<span>Track</span>
                </div>

                <div
                    className="app-search"
                    ref={searchContainerRef}
                >
                    <div className="app-search-form">
                        <input
                            type="search"
                            placeholder="Search companies..."
                            aria-label="Search companies"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setIsSearchOpen(true);
                            }}
                            onFocus={handleSearchFocus}
                            onKeyDown={handleSearchKeyDown}
                            autoComplete="off"
                        />

                        {query && (
                            <button
                                type="button"
                                className="app-search-clear"
                                onClick={handleClearSearch}
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}

                        {loading && (
                            <span className="app-search-loading">
                                Searching...
                            </span>
                        )}
                    </div>

                    {isSearchOpen && (
                        <div className="app-search-results">

                            {/* -------------------------------------- */}
                            {/* Recent Searches                         */}
                            {/* -------------------------------------- */}

                            {!query.trim() && (
                                <>
                                    <div className="app-search-section-title">
                                        Recent Searches
                                    </div>

                                    {historyLoading && (
                                        <p className="app-search-status">
                                            Loading recent searches...
                                        </p>
                                    )}

                                    {!historyLoading &&
                                        recentSearches.length === 0 && (
                                            <p className="app-search-status">
                                                No recent searches.
                                            </p>
                                        )}

                                    {!historyLoading &&
                                        recentSearches.map(
                                            (recent, index) => (
                                                <button
                                                    key={recent.id}
                                                    type="button"
                                                    className={`app-search-result ${highlightedIndex === index
                                                            ? 'highlighted'
                                                            : ''
                                                        }`}
                                                    onMouseEnter={() =>
                                                        setHighlightedIndex(index)
                                                    }
                                                    onClick={() =>
                                                        handleRecentSearchSelect(
                                                            recent
                                                        )
                                                    }
                                                >
                                                    <span className="app-search-result-icon">
                                                        🕘
                                                    </span>

                                                    <span className="app-search-result-content">
                                                        <strong>
                                                            {recent.company_name}
                                                        </strong>

                                                        <span>
                                                            {recent.symbol}
                                                        </span>
                                                    </span>

                                                    {/* Delete recent search */}

                                                    <span
                                                        className="app-search-history-delete"
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-label={`Remove ${recent.symbol} from recent searches`}
                                                        onClick={(event) =>
                                                            handleDeleteRecentSearch(
                                                                event,
                                                                recent.id
                                                            )
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key === 'Enter' ||
                                                                event.key === ' '
                                                            ) {
                                                                event.preventDefault();

                                                                handleDeleteRecentSearch(
                                                                    event,
                                                                    recent.id
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        ×
                                                    </span>
                                                </button>
                                            )
                                        )}
                                </>
                            )}

                            {/* -------------------------------------- */}
                            {/* Live Company Suggestions                */}
                            {/* -------------------------------------- */}

                            {query.trim() && (
                                <>
                                    {error && (
                                        <p className="app-search-error">
                                            {error}
                                        </p>
                                    )}

                                    {!error &&
                                        !loading &&
                                        results.map(
                                            (company, index) => {
                                                const symbol =
                                                    company.displaySymbol ||
                                                    company.symbol;

                                                return (
                                                    <button
                                                        key={`${company.symbol}-${company.displaySymbol}`}
                                                        type="button"
                                                        className={`app-search-result ${highlightedIndex === index
                                                                ? 'highlighted'
                                                                : ''
                                                            }`}
                                                        onMouseEnter={() =>
                                                            setHighlightedIndex(index)
                                                        }
                                                        onClick={() =>
                                                            handleCompanySelect(
                                                                company
                                                            )
                                                        }
                                                    >
                                                        <span className="app-search-result-icon">
                                                            🔍
                                                        </span>

                                                        <span className="app-search-result-content">
                                                            <strong>
                                                                {company.description}
                                                            </strong>

                                                            <span>
                                                                {symbol}

                                                                {company.type
                                                                    ? ` · ${company.type}`
                                                                    : ''}
                                                            </span>
                                                        </span>
                                                    </button>
                                                );
                                            }
                                        )}

                                    {!loading &&
                                        !error &&
                                        results.length === 0 && (
                                            <p className="app-search-status">
                                                No matching companies.
                                            </p>
                                        )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile */}

                <div className="app-profile">
                    <button
                        type="button"
                        className="app-profile-button"
                        onClick={() =>
                            setIsProfileOpen(
                                (current) => !current
                            )
                        }
                        aria-expanded={isProfileOpen}
                        aria-haspopup="menu"
                    >
                        <span className="app-profile-avatar">
                            {user?.email
                                ?.charAt(0)
                                .toUpperCase() || 'U'}
                        </span>

                        <span className="app-profile-label">
                            {user?.email || 'Profile'}
                        </span>

                        <span className="app-profile-chevron">
                            {isProfileOpen ? '▲' : '▼'}
                        </span>
                    </button>

                    {isProfileOpen && (
                        <div
                            className="app-profile-menu"
                            role="menu"
                        >
                            <div className="app-profile-menu-user">
                                <span>
                                    Signed in as
                                </span>

                                <strong>
                                    {user?.email || 'User'}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="app-profile-menu-item"
                                role="menuitem"
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate('/settings');
                                }}
                            >
                                <span>Profile</span>
                            </button>

                            <button
                                type="button"
                                className="app-profile-menu-item app-profile-signout"
                                role="menuitem"
                                onClick={handleLogout}
                            >
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Application */}

            <div className="app-layout">
                {/* Sidebar */}

                <aside className="app-sidebar">
                    <nav
                        className="app-sidebar-nav"
                        aria-label="Main navigation"
                    >
                        {navigationItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `app-nav-link${isActive ? ' active' : ''
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Settings */}

                    <div className="app-sidebar-bottom">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `app-nav-link${isActive ? ' active' : ''
                                }`
                            }
                        >
                            Settings
                        </NavLink>
                    </div>
                </aside>

                {/* Page Content */}

                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AppShell;