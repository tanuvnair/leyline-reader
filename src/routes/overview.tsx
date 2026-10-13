import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {
  ArrowsClockwiseIcon,
  FlaskIcon,
  ListChecksIcon,
  MapTrifoldIcon,
  TrophyIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
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
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {Skeleton} from '@/components/ui/skeleton';
import {Spinner} from '@/components/ui/spinner';
import {
  AccountGate,
  isNotLinkedError,
} from '@/components/account-setup-empty';
import {MetricCard} from '@/components/metric-card';
import {Page, PageHeading} from '@/components/page-heading';
import {
  MetricCardSkeleton,
  WorldProgressCardSkeleton,
} from '@/components/page-skeletons';
import {StatChip} from '@/components/stat-chip';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';
import {worldStatVisual} from '@/lib/genshin-visuals';

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

  const load = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeyline().data.overview({force});
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
        <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({length: 4}).map((_, index) => (
            <MetricCardSkeleton key={index} />
          ))}
        </div>
        <WorldProgressCardSkeleton />
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
            <Button disabled={loading} onClick={() => void load(true)}>
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
  const notesMissing = Boolean(data?.dailyNoteError) || !daily;

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
            onClick={() => void load(true)}
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

      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          metric="resin"
          title="Original Resin"
          muted={notesMissing}
          icon={FlaskIcon}
          value={
            daily
              ? `${daily.current_resin ?? '—'} / ${daily.max_resin ?? '—'}`
              : '—'
          }
          hint={formatDurationSeconds(daily?.resin_recovery_time)}
        />
        <MetricCard
          metric="commission"
          title="Daily commissions"
          muted={notesMissing}
          icon={ListChecksIcon}
          value={
            daily
              ? `${daily.finished_task_num ?? 0} / ${daily.total_task_num ?? 4}`
              : '—'
          }
        />
        <MetricCard
          metric="expedition"
          title="Expeditions"
          muted={notesMissing}
          icon={MapTrifoldIcon}
          value={
            daily
              ? `${daily.current_expedition_num ?? 0} / ${daily.max_expedition_num ?? 5}`
              : '—'
          }
        />
        <MetricCard
          metric="achievement"
          title="Achievements"
          icon={TrophyIcon}
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
                <EmptyMedia variant="icon">
                  <MapTrifoldIcon />
                </EmptyMedia>
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
                .map(([key, value]) => {
                  const visual = worldStatVisual(key);
                  const label = `${key.replaceAll('_', ' ')}: ${String(value)}`;
                  if (visual.kind === 'element' && visual.element) {
                    return (
                      <StatChip
                        key={key}
                        kind="element"
                        element={visual.element}
                      >
                        {label}
                      </StatChip>
                    );
                  }
                  if (visual.kind === 'chest') {
                    return (
                      <StatChip key={key} kind="stat" stat="chest">
                        {label}
                      </StatChip>
                    );
                  }
                  if (visual.kind === 'achievement') {
                    return (
                      <StatChip key={key} kind="stat" stat="achievement">
                        {label}
                      </StatChip>
                    );
                  }
                  return (
                    <Badge key={key} variant="secondary">
                      {label}
                    </Badge>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
