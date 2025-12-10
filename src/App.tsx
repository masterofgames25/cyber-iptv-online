
import CyberApp from './CyberApp';
import { DataProvider } from './context/DataContext';
import { CyberpunkNotificationProvider } from './components/CyberpunkNotification';
import { AuthProvider } from './context/AuthContext';
import { ReloadPrompt } from './components/ReloadPrompt';

export default function App() {
  return (
    <CyberpunkNotificationProvider>
      <DataProvider>
        <AuthProvider>
          <CyberApp />
          <ReloadPrompt />
        </AuthProvider>
      </DataProvider>
    </CyberpunkNotificationProvider>
  );
}

