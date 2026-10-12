import {HashRouter, Navigate, Route, Routes} from 'react-router-dom';
import {Toaster} from '@/components/ui/sonner';
import {AppFrame} from '@/components/app-frame';
import {AppShell} from '@/components/app-shell';
import {AuthProvider} from '@/hooks/use-auth';
import {RequireAuth} from '@/routes/require-auth';
import {LoginPage} from '@/routes/login';
import {OverviewPage} from '@/routes/overview';
import {CharactersPage} from '@/routes/characters';
import {AbyssPage} from '@/routes/abyss';
import {SettingsPage} from '@/routes/settings';

export default function App() {
  return (
    <AuthProvider>
      <AppFrame>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="characters" element={<CharactersPage />} />
                <Route path="abyss" element={<AbyssPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AppFrame>
      <Toaster richColors closeButton />
    </AuthProvider>
  );
}
