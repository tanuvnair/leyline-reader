import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {ArrowsClockwiseIcon, WarningCircleIcon} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {Skeleton} from '@/components/ui/skeleton';
import {Spinner} from '@/components/ui/spinner';
import {
  AccountGate,
  isNotLinkedError,
} from '@/components/account-setup-empty';
import {Page, PageHeading} from '@/components/page-heading';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';

interface OverviewData {
  account: {
    uid: number;
    nickname: string;
    level: number;
    region: string;
  } | null;
  records: {
    stats?: Record<string, unknown>;
    role?: Record<string, unknown>;
  } | null;
  dailyNote: {
    current_resin?: number;
    max_resin?: number;
    finished_task_num?: number;
    total_task_num?: number;
    current_expedition_num?: number;
    max_expedition_num?: number;
    resin_recovery_time?: string;
  } | null;
  dailyNoteError: string | null;
}

function formatDurationSeconds(raw?: string): string | undefined {
  if (!raw) {
    return undefined;
  }
  const total = Number(raw);
  if (!Number.isFinite(total) || total <= 0) {
    return undefined;
  }
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return `Full in ${hours}h ${minutes}m`;
  }
  return `Full in ${minutes}m`;
}

export function OverviewPage() {
  return (
    <AccountGate>
      <OverviewLinked />
    </AccountGate>
  );
}

function OverviewLinked() {
  const {refresh: refreshAccount} = useHoyoAccount();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realTimeNotesUrl, setRealTimeNotesUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeyline().data.overview();
      if (!result.ok) {
        const message = result.error ?? 'Failed to load overview';
        if (isNotLinkedError(message)) {
          await refreshAccount();
        }
        setError(message);
        setData(null);
        return;
      }
      setData({
        account: result.account,
        records: result.records,
        dailyNote: result.dailyNote,
        dailyNoteError:
          typeof result.dailyNoteError === 'string'
            ? result.dailyNoteError
            : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load';
      if (isNotLinkedError(message)) {
        await refreshAccount();
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void getLeyline()
      .getPublicConfig()
      .then((config) => setRealTimeNotesUrl(config.hoyo.realTimeNotesUrl))
      .catch(() => {
        setRealTimeNotesUrl(null);
      });
  }, []);

  if (loading) {
    return (
      <Page>
        <PageHeading
          title="Overview"
          description={
            <span className="inline-block h-4 w-72">
              <Skeleton />
            </span>
          }
          actions={
            <Button variant="outline" disabled>
              <Spinner data-icon="inline-start" />
              Refresh
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({length: 4}).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-20">
                  <Skeleton />
                </div>
                <div className="h-7 w-28">
                  <Skeleton />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-36">
              <Skeleton />
            </div>
            <div className="h-4 w-56">
              <Skeleton />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({length: 8}).map((_, index) => (
                <div key={index} className="h-5 w-24">
                  <Skeleton variant="pill" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Page>
    );
  }

  if (error && !isNotLinkedError(error)) {
    return (
      <Page>
        <PageHeading
          title="Overview"
          description="Daily note and world progress for your linked account"
          actions={
            <Button disabled={loading} onClick={() => void load()}>
              <ArrowsClockwiseIcon data-icon="inline-start" />
              Retry
            </Button>
          }
        />
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Could not sync</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Page>
    );
  }

  const stats = data?.records?.stats ?? {};
  const daily = data?.dailyNote;

  return (
    <Page>
      <PageHeading
        title="Overview"
        description={
          data?.account
            ? `${data.account.nickname} · AR ${data.account.level} · UID ${data.account.uid}`
            : 'Account synced'
        }
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load()}
          >
            {loading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ArrowsClockwiseIcon data-icon="inline-start" />
            )}
            Refresh
          </Button>
        }
      />

      {data?.dailyNoteError ? (
        <Alert>
          <WarningCircleIcon />
          <AlertTitle>Real-Time Notes unavailable</AlertTitle>
          <AlertDescription>
            <p>{data.dailyNoteError}</p>
            {realTimeNotesUrl ? (
              <p>
                <a
                  href={realTimeNotesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Battle Chronicle
                </a>
              </p>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Resin"
          value={
            daily
              ? `${daily.current_resin ?? '—'} / ${daily.max_resin ?? '—'}`
              : '—'
          }
          hint={formatDurationSeconds(daily?.resin_recovery_time)}
        />
        <StatCard
          title="Daily commissions"
          value={
            daily
              ? `${daily.finished_task_num ?? 0} / ${daily.total_task_num ?? 4}`
              : '—'
          }
        />
        <StatCard
          title="Expeditions"
          value={
            daily
              ? `${daily.current_expedition_num ?? 0} / ${daily.max_expedition_num ?? 5}`
              : '—'
          }
        />
        <StatCard
          title="Achievements"
          value={String(
            stats['achievement_number'] ?? stats['achievement'] ?? '—',
          )}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>World progress</CardTitle>
          <CardDescription>Highlights from your game record</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(stats).length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No stats available</EmptyTitle>
                <EmptyDescription>
                  Sync again after linking your account.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats)
                .slice(0, 12)
                .map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {key.replaceAll('_', ' ')}: {String(value)}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <CardDescription>{hint}</CardDescription>
        </CardContent>
      ) : null}
    </Card>
  );
}
