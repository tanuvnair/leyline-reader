import {useState, type ReactNode} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {LinkIcon} from '@phosphor-icons/react';
import {Button} from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {Skeleton} from '@/components/ui/skeleton';
import {Spinner} from '@/components/ui/spinner';
import {Page} from '@/components/page-heading';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';

/** Matches the centered empty CTA so status resolution does not flash page chrome. */
export function AccountSetupSkeleton() {
  return (
    <Page className="min-h-full flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <div className="size-12">
          <Skeleton />
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <div className="h-6 w-56">
            <Skeleton />
          </div>
          <div className="h-4 w-full max-w-72">
            <Skeleton />
          </div>
          <div className="h-4 w-48">
            <Skeleton />
          </div>
        </div>
        <div className="h-9 w-36">
          <Skeleton />
        </div>
      </div>
    </Page>
  );
}

/** Gates linked-only routes: shared status avoids skeleton → empty flicker on nav. */
export function AccountGate({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  const {ready, linked, refresh} = useHoyoAccount();

  if (!ready) {
    return <AccountSetupSkeleton />;
  }

  if (!linked) {
    return (
      <Page className="min-h-full flex-1 items-center justify-center">
        <AccountSetupEmpty
          description={description}
          onChanged={() => void refresh()}
        />
      </Page>
    );
  }

  return children;
}

export function AccountSetupEmpty({
  title = 'Link a HoYoverse account',
  description = 'Sign in through the in-app browser so Leyline can read your Genshin records. Cookies stay encrypted on this device.',
  onChanged,
}: {
  title?: string;
  description?: string;
  onChanged?: () => void;
}) {
  const navigate = useNavigate();
  const {refresh} = useHoyoAccount();
  const [busy, setBusy] = useState(false);

  const linkAccount = async () => {
    setBusy(true);
    try {
      const result = await getLeyline().hoyo.link();
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to link account');
        return;
      }
      toast.success(`Linked ${result.account.nickname}`);
      await refresh();
      onChanged?.();
      navigate('/');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LinkIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button disabled={busy} onClick={() => void linkAccount()}>
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <LinkIcon data-icon="inline-start" />
          )}
          Link HoYoverse
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function isNotLinkedError(error: string | null | undefined): boolean {
  if (!error) {
    return false;
  }
  return (
    error === 'not-linked' ||
    error.toLowerCase().includes('not linked') ||
    error.toLowerCase().includes('hoyoverse account is not linked')
  );
}
