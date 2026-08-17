import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, signOut } = useAuth();

  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <main>
      <h1>investTrack Dashboard</h1>

      <p>Welcome to your investment portfolio.</p>

      <p>Signed in as: {user?.email}</p>

      <button onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default Dashboard;