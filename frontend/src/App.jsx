import { Navigate, Route, Routes } from 'react-router-dom';

import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyDetail from './pages/CompanyDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Feedback from './pages/Feedback';
import Holdings from './pages/Holdings';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import TopCompanies from './pages/TopCompanies';
import Watchlist from './pages/Watchlist';
import Wishlist from './pages/Wishlist';

function PublicOnlyRoute({ children }) {
  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Protected application */}

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/portfolio"
          element={<Portfolio />}
        />

        <Route
          path="/holdings"
          element={<Holdings />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        <Route
          path="/watchlist"
          element={<Watchlist />}
        />

        <Route
          path="/top-companies"
          element={<TopCompanies />}
        />

        <Route
          path="/feedback"
          element={<Feedback />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

        <Route
          path="/company/:symbol"
          element={<CompanyDetail />}
        />
      </Route>

      {/* Default route */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;