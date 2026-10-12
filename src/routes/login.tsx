import {useEffect, useState} from 'react';
import {Navigate} from 'react-router-dom';
import {toast} from 'sonner';
import {WarningCircleIcon} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {Spinner} from '@/components/ui/spinner';
import {PasswordInput} from '@/components/password-input';
import {useAuth} from '@/hooks/use-auth';
import {getLeyline} from '@/lib/leyline';
import {
  type PasswordPolicy,
  describePasswordPolicy,
  validateNewPassword,
  validateRequiredPassword,
} from '@/lib/password-policy';

interface FieldErrors {
  password?: string;
  confirm?: string;
}

export function LoginPage() {
  const {
    loading,
    hasPassword,
    unlocked,
    bridgeError,
    setup,
    unlock,
    refresh,
  } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 10,
    requireLetter: true,
    requireNumber: true,
    requireSpecial: false,
  });

  useEffect(() => {
    void getLeyline()
      .getPublicConfig()
      .then((config) => setPolicy(config.auth.passwordPolicy))
      .catch(() => {
        // Keep defaults when bridge is unavailable (bridgeError UI handles that).
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-muted-foreground">
        <Spinner />
        Loading…
      </div>
    );
  }

  if (bridgeError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center app-atmosphere p-6">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Cannot start</CardTitle>
              <CardDescription>{bridgeError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <WarningCircleIcon />
                <AlertTitle>Bridge unavailable</AlertTitle>
                <AlertDescription>
                  Run Leyline Reader through Electron so the local vault can
                  load.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter align="end">
              <Button onClick={() => void refresh()}>Retry</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (unlocked) {
    return <Navigate to="/" replace />;
  }

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (hasPassword) {
      const passwordError = validateRequiredPassword(password);
      if (passwordError) {
        next.password = passwordError;
      }
    } else {
      const passwordError = validateNewPassword(password, policy);
      if (passwordError) {
        next.password = passwordError;
      }
      if (!confirm) {
        next.confirm = 'Confirm your password';
      } else if (password !== confirm) {
        next.confirm = 'Passwords do not match';
      }
    }
    return next;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirm) {
      return;
    }

    setBusy(true);
    try {
      if (!hasPassword) {
        const result = await setup(password);
        if (!result.ok) {
          setErrors({password: result.error ?? 'Failed to create password'});
          return;
        }
        toast.success('Vault created');
      } else {
        const result = await unlock(password);
        if (!result.ok) {
          setErrors({password: result.error ?? 'Incorrect password'});
          return;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center app-atmosphere p-6">
      <div className="w-full max-w-md">
        <form noValidate onSubmit={(e) => void onSubmit(e)}>
          <Card>
            <CardHeader>
              <CardTitle>Leyline Reader</CardTitle>
              <CardDescription>
                {hasPassword
                  ? 'Enter your app password to unlock the local vault.'
                  : 'Create a local password to protect HoYoverse cookies on this device.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field
                  data-invalid={Boolean(errors.password) || undefined}
                  data-disabled={busy || undefined}
                >
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <PasswordInput
                    id="password"
                    autoComplete={
                      hasPassword ? 'current-password' : 'new-password'
                    }
                    value={password}
                    disabled={busy}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) {
                        setErrors((prev) => ({...prev, password: undefined}));
                      }
                    }}
                    aria-invalid={Boolean(errors.password) || undefined}
                  />
                  {!hasPassword ? (
                    <FieldDescription>
                      {describePasswordPolicy(policy)}
                    </FieldDescription>
                  ) : null}
                  {errors.password ? (
                    <FieldError>{errors.password}</FieldError>
                  ) : null}
                </Field>
                {!hasPassword ? (
                  <Field
                    data-invalid={Boolean(errors.confirm) || undefined}
                    data-disabled={busy || undefined}
                  >
                    <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
                    <PasswordInput
                      id="confirm"
                      autoComplete="new-password"
                      value={confirm}
                      disabled={busy}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        if (errors.confirm) {
                          setErrors((prev) => ({...prev, confirm: undefined}));
                        }
                      }}
                      aria-invalid={Boolean(errors.confirm) || undefined}
                    />
                    {errors.confirm ? (
                      <FieldError>{errors.confirm}</FieldError>
                    ) : null}
                  </Field>
                ) : null}
              </FieldGroup>
            </CardContent>
            <CardFooter align="end">
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner data-icon="inline-start" /> : null}
                {hasPassword ? 'Unlock' : 'Create vault'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
