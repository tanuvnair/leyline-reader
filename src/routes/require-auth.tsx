import {Navigate, Outlet} from 'react-router-dom';
import {Spinner} from '@/components/ui/spinner';
import {useAuth} from '@/hooks/use-auth';

export function RequireAuth() {
  const {loading, unlocked, bridgeError} = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-muted-foreground">
        <Spinner />
        Loading…
      </div>
    );
  }

  if (bridgeError || !unlocked) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
