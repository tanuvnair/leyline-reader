import {
  memo,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
  DiamondsFourIcon,
  GearIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Skeleton} from '@/components/ui/skeleton';
import {InventoryItemCard} from '@/components/inventory-item-card';
import {Page, PageHeading} from '@/components/page-heading';
import {ArtifactsPageSkeleton} from '@/components/page-skeletons';
import {StatChip} from '@/components/stat-chip';
import {
  useGoodInventory,
  type GoodArtifactRow,
} from '@/hooks/use-good-inventory';
import {
  formatGoodLocationLabel,
  formatGoodSetName,
  formatGoodSlotLabel,
  formatGoodStatChip,
  formatGoodStatLabel,
} from '@/lib/good-labels';

const SLOT_KEYS = [
  'flower',
  'plume',
  'sands',
  'goblet',
  'circlet',
] as const;

type SlotKey = (typeof SLOT_KEYS)[number];
type EquippedFilter = 'all' | 'yes' | 'no';

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

function isEquipped(location: string): boolean {
  return Boolean(location.trim());
}

function artifactRowKey(artifact: GoodArtifactRow): string {
  return [
    artifact.setKey,
    artifact.slotKey,
    artifact.level,
    artifact.mainStatKey,
    artifact.location,
    artifact.substats.map((s) => `${s.key}:${s.value}`).join('|'),
  ].join('::');
}

const ArtifactCard = memo(function ArtifactCard({
  artifact,
}: {
  artifact: GoodArtifactRow;
}) {
  const title = formatGoodSetName(artifact.setKey);
  const equippedNow = isEquipped(artifact.location);
  const locationLabel = formatGoodLocationLabel(artifact.location);

  return (
    <InventoryItemCard
      title={title}
      description={`${formatGoodSlotLabel(artifact.slotKey)} · +${artifact.level}`}
      rarity={artifact.rarity}
      icon={artifact.icon}
      iconFallback={artifact.iconFallback}
      locked={artifact.lock}
      starred={Boolean(artifact.star)}
      equipped={
        equippedNow
          ? {
              name: locationLabel,
              icon: artifact.locationIcon,
              iconFallback: artifact.locationIconFallback,
            }
          : null
      }
      chips={
        <>
          <StatChip kind="plain">
            {formatGoodStatLabel(artifact.mainStatKey)}
          </StatChip>
          {artifact.substats.slice(0, 4).map((sub) => (
            <StatChip key={`${sub.key}-${sub.value}`} kind="plain">
              {formatGoodStatChip(sub.key, sub.value)}
            </StatChip>
          ))}
        </>
      }
    />
  );
});

function InventorySettingsCta({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Page className="min-h-full flex-1 items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DiamondsFourIcon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/settings">
              <GearIcon data-icon="inline-start" />
              Open Settings
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </Page>
  );
}

export function ArtifactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    error,
    imported,
    source,
    version,
    importedAt,
    artifactCount,
    artifacts,
    refresh,
  } = useGoodInventory();

  const qParam = searchParams.get('q') ?? '';
  const slot = (searchParams.get('slot') ?? 'all') as SlotKey | 'all';
  const equipped = (searchParams.get('equipped') ?? 'all') as EquippedFilter;

  const [qInput, setQInput] = useState(qParam);
  const deferredQuery = useDeferredValue(qInput);

  const setParam = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === 'all') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      },
      {replace: true},
    );
  };

  useEffect(() => {
    setQInput((prev) => (prev === qParam ? prev : qParam));
  }, [qParam]);

  useEffect(() => {
    if (qInput === qParam) {
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(() => {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (!qInput) {
              next.delete('q');
            } else {
              next.set('q', qInput);
            }
            return next;
          },
          {replace: true},
        );
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [qInput, qParam, setSearchParams]);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    });
  }, [refresh]);

  const indexed = useMemo(
    () =>
      artifacts.map((artifact) => ({
        artifact,
        key: artifactRowKey(artifact),
        haystack: [
          artifact.setKey,
          artifact.location,
          artifact.mainStatKey,
          artifact.slotKey,
          formatGoodSetName(artifact.setKey),
          formatGoodLocationLabel(artifact.location),
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [artifacts],
  );

  const filtered = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    return indexed.filter(({artifact, haystack}) => {
      if (slot !== 'all' && artifact.slotKey !== slot) {
        return false;
      }
      const equippedNow = isEquipped(artifact.location);
      if (equipped === 'yes' && !equippedNow) {
        return false;
      }
      if (equipped === 'no' && equippedNow) {
        return false;
      }
      if (!query) {
        return true;
      }
      return haystack.includes(query);
    });
  }, [deferredQuery, equipped, indexed, slot]);

  if (loading && !imported) {
    return (
      <Page>
        <PageHeading
          title="Artifacts"
          description={
            <span className="inline-block h-4 w-96 max-w-full">
              <Skeleton />
            </span>
          }
        />
        <ArtifactsPageSkeleton />
      </Page>
    );
  }

  if (!imported) {
    return (
      <InventorySettingsCta
        title="No GOOD inventory yet"
        description={
          error ??
          'Import a GOOD JSON export in Settings (from a scanner, Genshin Optimizer, or Irminsul). HoYoLab does not expose the full bag.'
        }
      />
    );
  }

  if (artifactCount === 0) {
    return (
      <InventorySettingsCta
        title="No artifacts in this import"
        description="Your GOOD file had no artifacts[]. Re-export with artifacts included, then replace the inventory in Settings."
      />
    );
  }

  return (
    <Page>
      <PageHeading
        title="Artifacts"
        description="Browse your vault-encrypted GOOD artifact inventory. Import and clear live in Settings."
      />

      {error ? (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Artifacts error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <DiamondsFourIcon />
        <AlertTitle>GOOD inventory loaded</AlertTitle>
        <AlertDescription>
          {artifactCount} piece{artifactCount === 1 ? '' : 's'} from{' '}
          {source ?? 'unknown'} (v{version ?? '?'}) · imported{' '}
          {formatImportedAt(importedAt)}.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="artifacts-q">Search</FieldLabel>
            <Input
              id="artifacts-q"
              value={qInput}
              placeholder="Set or character…"
              onChange={(event) => setQInput(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Slot</FieldLabel>
            <Select
              value={slot}
              onValueChange={(value) => setParam('slot', value ?? 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Slots" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Slots</SelectItem>
                  {SLOT_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {formatGoodSlotLabel(key)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Equipped</FieldLabel>
            <Select
              value={equipped}
              onValueChange={(value) => setParam('equipped', value ?? 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Equipped</SelectItem>
                  <SelectItem value="no">Unequipped</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({artifact, key}) => (
            <ArtifactCard key={key} artifact={artifact} />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DiamondsFourIcon />
            </EmptyMedia>
            <EmptyTitle>No artifacts match filters</EmptyTitle>
            <EmptyDescription>
              Try clearing search, slot, or equipped filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Page>
  );
}
