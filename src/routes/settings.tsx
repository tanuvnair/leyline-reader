import {useEffect, useRef, useState, type ChangeEvent} from 'react';
import {useTheme} from 'next-themes';
import {toast} from 'sonner';
import {TrashIcon, UploadSimpleIcon} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {Page, PageHeading} from '@/components/page-heading';
import {PasswordInput} from '@/components/password-input';
import {useGoodInventory} from '@/hooks/use-good-inventory';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';
import {
  type PasswordPolicy,
  describePasswordPolicy,
  validateNewPassword,
  validateRequiredPassword,
} from '@/lib/password-policy';

function formatImportedAt(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

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
  const {
    loading: inventoryLoading,
    busy: inventoryBusy,
    imported,
    source,
    version,
    importedAt,
    artifactCount,
    weaponCount,
    materialCount,
    refresh: refreshInventory,
    importJson,
    clearInventory,
  } = useGoodInventory();
  const {theme, setTheme} = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [themeReady, setThemeReady] = useState(false);
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
    setThemeReady(true);
  }, []);

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

  useEffect(() => {
    void refreshInventory().catch((err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to load inventory',
      );
    });
  }, [refreshInventory]);

  const onPickGoodFile = () => {
    fileInputRef.current?.click();
  };

  const onGoodFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    const text = await file.text();
    const result = await importJson(text);
    if (!result.ok) {
      toast.error(result.error ?? 'Import failed');
      return;
    }
    toast.success(
      `Imported ${result.artifactCount ?? 0} artifacts, ${
        result.weaponCount ?? 0
      } weapons, ${result.materialCount ?? 0} materials`,
    );
  };

  const onClearInventory = async () => {
    const result = await clearInventory();
    if (!result.ok) {
      toast.error(result.error ?? 'Clear failed');
      return;
    }
    toast.success('Cleared GOOD inventory');
  };

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
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Light, dark, or follow the system preference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <FieldLabel>Theme</FieldLabel>
            {themeReady ? (
              <ToggleGroup
                type="single"
                variant="outline"
                value={theme ?? 'system'}
                onValueChange={(value) => {
                  if (value) {
                    setTheme(value);
                  }
                }}
              >
                <ToggleGroupItem value="light">Light</ToggleGroupItem>
                <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
                <ToggleGroupItem value="system">System</ToggleGroupItem>
              </ToggleGroup>
            ) : (
              <div className="flex h-9 w-64 gap-2">
                <div className="h-9 flex-1">
                  <Skeleton />
                </div>
                <div className="h-9 flex-1">
                  <Skeleton />
                </div>
                <div className="h-9 flex-1">
                  <Skeleton />
                </div>
              </div>
            )}
          </Field>
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle>GOOD inventory</CardTitle>
          <CardDescription>
            Import a GOOD JSON export from a scanner,{' '}
            <span className="text-foreground">Genshin Optimizer</span>, or{' '}
            <span className="text-foreground">Irminsul</span>. Artifacts,
            weapons, and materials (when present) are stored encrypted with OS
            safeStorage. HoYoLab does not expose the full bag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(event) => void onGoodFileChange(event)}
          />
          {inventoryLoading && !imported ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-20">
                <Skeleton variant="pill" />
              </div>
              <div className="h-4 w-56">
                <Skeleton />
              </div>
            </div>
          ) : imported ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Imported</Badge>
                <span className="text-sm text-muted-foreground">
                  {source ?? 'unknown'} · v{version ?? '?'} ·{' '}
                  {formatImportedAt(importedAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {artifactCount} artifact{artifactCount === 1 ? '' : 's'}
                </Badge>
                <Badge variant="secondary">
                  {weaponCount} weapon{weaponCount === 1 ? '' : 's'}
                </Badge>
                <Badge variant="secondary">
                  {materialCount} material{materialCount === 1 ? '' : 's'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Not imported</Badge>
              <span className="text-sm text-muted-foreground">
                Browse Artifacts, Weapons, and Materials after import.
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy || inventoryBusy}
              onClick={onPickGoodFile}
            >
              {inventoryBusy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UploadSimpleIcon data-icon="inline-start" />
              )}
              {imported ? 'Replace GOOD JSON' : 'Import GOOD JSON'}
            </Button>
            {imported ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={busy || inventoryBusy}
                  >
                    <TrashIcon data-icon="inline-start" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <TrashIcon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      Clear GOOD inventory?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the vault-encrypted GOOD inventory
                      (artifacts, weapons, and materials) from this device. You
                      can import an export again later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={inventoryBusy}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={inventoryBusy}
                      onClick={() => void onClearInventory()}
                    >
                      {inventoryBusy ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <TrashIcon data-icon="inline-start" />
                      )}
                      Clear inventory
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
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
