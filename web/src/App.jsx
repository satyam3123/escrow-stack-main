import { useAuth } from './context/AuthContext.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="atmosphere grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="breathe h-2 w-2 rounded-full bg-gold" />
          <span className="eyebrow text-faint">Opening terminal</span>
        </div>
      </div>
    );
  }

  return token && user ? <Dashboard /> : <AuthScreen />;
}
