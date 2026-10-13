import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {
  ArrowsClockwiseIcon,
  CastleTurretIcon,
  StarIcon,
  SwordIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {Spinner} from '@/components/ui/spinner';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  AccountGate,
  isNotLinkedError,
} from '@/components/account-setup-empty';
import {MetricCard} from '@/components/metric-card';
import {Page, PageHeading} from '@/components/page-heading';
import {MetricCardSkeleton} from '@/components/page-skeletons';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';
import {battlesTone} from '@/lib/genshin-visuals';

const ABYSS_STAR_MAX = 36;

interface AbyssData {
  max_floor?: string;
  total_star?: number;
  total_battle_times?: number;
  total_win_times?: number;
  is_unlock?: boolean;
  start_time?: string;
  end_time?: string;
}

function formatAbyssTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  return new Date(ms).toLocaleDateString(undefined, {dateStyle: 'medium'});
}

function formatCycleWindow(abyss: AbyssData): string {
  const start = formatAbyssTimestamp(abyss.start_time);
  const end = formatAbyssTimestamp(abyss.end_time);
  if (start && end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return `Started ${start}`;
  }
  return 'Cycle window unavailable';
}

function AbyssStarRow({stars}: {stars: number}) {
  const filled = Math.max(0, Math.min(ABYSS_STAR_MAX, stars));
  const segments = 12;
  const perSegment = ABYSS_STAR_MAX / segments;
  return (
    <div className="flex flex-wrap gap-1" data-abyss-stars aria-hidden>
      {Array.from({length: segments}).map((_, index) => {
        const threshold = (index + 1) * perSegment;
        const isFilled = filled >= threshold;
        return (
          <span key={index} data-filled={isFilled ? '' : undefined}>
            <StarIcon weight={isFilled ? 'fill' : 'regular'} />
          </span>
        );
      })}
    </div>
  );
}

export function AbyssPage() {
  return (
    <AccountGate description="Spiral Abyss needs a linked HoYoverse account.">
      <AbyssLinked />
    </AccountGate>
  );
}

function AbyssLinked() {
  const {refresh: refreshAccount} = useHoyoAccount();
  const [schedule, setSchedule] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [abyss, setAbyss] = useState<AbyssData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (type: 1 | 2, force = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeyline().data.abyss(type, {force});
      if (!result.ok) {
        const message = result.error ?? 'Failed to load Spiral Abyss';
        if (isNotLinkedError(message)) {
          await refreshAccount();
        }
        setError(message);
        setAbyss(null);
        return;
      }
      setAbyss(result.abyss as AbyssData);
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
    void load(schedule);
  }, [schedule]);

  return (
    <Page>
      <PageHeading
        title="Spiral Abyss"
        description="Current and previous cycle performance"
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load(schedule, true)}
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

      <Tabs
        value={String(schedule)}
        onValueChange={(value) => setSchedule(Number(value) as 1 | 2)}
      >
        <TabsList>
          <TabsTrigger value="1" disabled={loading}>
            Current
          </TabsTrigger>
          <TabsTrigger value="2" disabled={loading}>
            Previous
          </TabsTrigger>
        </TabsList>
        <TabsContent value={String(schedule)}>
          {loading ? (
            <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({length: 4}).map((_, index) => (
                <MetricCardSkeleton key={index} footer="rich" />
              ))}
            </div>
          ) : null}
          {error && !isNotLinkedError(error) ? (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertTitle>Could not load Abyss</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {!loading && !error && abyss ? (
            !abyss.is_unlock &&
            (abyss.total_star ?? 0) === 0 &&
            (abyss.max_floor === '0-0' || !abyss.max_floor) ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CastleTurretIcon />
                  </EmptyMedia>
                  <EmptyTitle>No Abyss data for this cycle</EmptyTitle>
                  <EmptyDescription>
                    {formatCycleWindow(abyss)}. Play Spiral Abyss in-game, then
                    refresh.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  metric="abyss"
                  title="Deepest floor"
                  icon={CastleTurretIcon}
                  value={abyss.max_floor ?? '—'}
                  footer="rich"
                />
                <MetricCard
                  metric="stars"
                  title="Stars"
                  icon={StarIcon}
                  value={abyss.total_star ?? '—'}
                  hint={`of ${ABYSS_STAR_MAX}`}
                  footer="rich"
                >
                  <AbyssStarRow stars={abyss.total_star ?? 0} />
                </MetricCard>
                <MetricCard
                  metric="battles"
                  title="Battles (wins / total)"
                  icon={SwordIcon}
                  tone={battlesTone(
                    abyss.total_win_times ?? 0,
                    abyss.total_battle_times ?? 0,
                  )}
                  value={`${abyss.total_win_times ?? 0} / ${abyss.total_battle_times ?? 0}`}
                  footer="rich"
                />
                <MetricCard
                  metric="status"
                  title="Status"
                  tone={abyss.is_unlock ? undefined : 'muted'}
                  value={abyss.is_unlock ? 'Unlocked' : 'Locked'}
                  hint={formatCycleWindow(abyss)}
                  footer="rich"
                />
              </div>
            )
          ) : null}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
