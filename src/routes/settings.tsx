import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {Spinner} from '@/components/ui/spinner';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {Page, PageHeading} from '@/components/page-heading';
import {PasswordInput} from '@/components/password-input';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';
import {
  type PasswordPolicy,
  describePasswordPolicy,
  validateNewPassword,
  validateRequiredPassword,
} from '@/lib/password-policy';

interface FieldErrors {
  current?: string;
  next?: string;
}

export function SettingsPage() {
  const {
    ready,
    linked,
    account,
    refresh: refreshAccount,
  } = useHoyoAccount();
  const [busy, setBusy] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [productName, setProductName] = useState('Leyline Reader');
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
      .then((config) => {
        setProductName(config.productName);
        setPolicy(config.auth.passwordPolicy);
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : 'Failed to load settings',
        );
      })
      .finally(() => {
        setConfigLoading(false);
      });
  }, []);

  const linkAccount = async () => {
    setBusy(true);
    try {
      const result = await getLeyline().hoyo.link();
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to link account');
        return;
      }
      toast.success(`Linked ${result.account.nickname}`);
      await refreshAccount();
    } finally {
      setBusy(false);
    }
  };

  const unlinkAccount = async () => {
    setBusy(true);
    try {
      await getLeyline().hoyo.unlink();
      toast.success('HoYoverse account disconnected');
      await refreshAccount();
    } finally {
      setBusy(false);
    }
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const currentError = validateRequiredPassword(currentPassword);
    if (currentError) {
      next.current = currentError;
    }
    const newError = validateNewPassword(newPassword, policy);
    if (newError) {
      next.next = newError;
    }
    return next;
  };

  const onChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.current || nextErrors.next) {
      return;
    }

    setBusy(true);
    try {
      const result = await getLeyline().auth.changePassword(
        currentPassword,
        newPassword,
      );
      if (!result.ok) {
        setErrors({next: result.error ?? 'Failed to change password'});
        return;
      }
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setErrors({});
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageHeading
        title="Settings"
        description={
          configLoading ? (
            <span className="inline-block h-4 w-72">
              <Skeleton />
            </span>
          ) : (
            `Manage ${productName} vault and HoYoverse sync`
          )
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>HoYoverse account</CardTitle>
          <CardDescription>
            Opens a secure login window, captures session cookies, and stores
            them encrypted with OS safeStorage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-20">
                <Skeleton variant="pill" />
              </div>
              <div className="h-4 w-48">
                <Skeleton />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant={linked ? 'default' : 'secondary'}>
                {linked ? 'Linked' : 'Not linked'}
              </Badge>
              {account ? (
                <span className="text-sm text-muted-foreground">
                  {account.nickname} · UID {account.uid} · AR {account.level}
                </span>
              ) : null}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!ready ? (
            <div className="h-9 w-44">
              <Skeleton />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => void linkAccount()}>
                {busy ? <Spinner data-icon="inline-start" /> : null}
                {linked ? 'Re-link account' : 'Link HoYoverse account'}
              </Button>
              {linked ? (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void unlinkAccount()}
                >
                  Disconnect
                </Button>
              ) : null}
            </div>
          )}
        </CardFooter>
      </Card>

      <form noValidate onSubmit={(e) => void onChangePassword(e)}>
        <Card>
          <CardHeader>
            <CardTitle>App password</CardTitle>
            <CardDescription>
              Protects the local vault on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field
                data-invalid={Boolean(errors.current) || undefined}
                data-disabled={busy || undefined}
              >
                <FieldLabel htmlFor="current">Current password</FieldLabel>
                <PasswordInput
                  id="current"
                  autoComplete="current-password"
                  value={currentPassword}
                  disabled={busy}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.current) {
                      setErrors((prev) => ({...prev, current: undefined}));
                    }
                  }}
                  aria-invalid={Boolean(errors.current) || undefined}
                />
                {errors.current ? (
                  <FieldError>{errors.current}</FieldError>
                ) : null}
              </Field>
              <Field
                data-invalid={Boolean(errors.next) || undefined}
                data-disabled={busy || undefined}
              >
                <FieldLabel htmlFor="next">New password</FieldLabel>
                <PasswordInput
                  id="next"
                  autoComplete="new-password"
                  value={newPassword}
                  disabled={busy}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.next) {
                      setErrors((prev) => ({...prev, next: undefined}));
                    }
                  }}
                  aria-invalid={Boolean(errors.next) || undefined}
                />
                <FieldDescription>
                  {describePasswordPolicy(policy)}
                </FieldDescription>
                {errors.next ? <FieldError>{errors.next}</FieldError> : null}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter align="end">
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Update password
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Page>
  );
}
