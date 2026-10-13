import {
  memo,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
  DiamondsFourIcon,
  LockSimpleIcon,
  StarIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
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
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {Spinner} from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {Page, PageHeading} from '@/components/page-heading';
import {ArtifactsPageSkeleton} from '@/components/page-skeletons';
import {RarityStars} from '@/components/rarity-stars';
import {StatChip} from '@/components/stat-chip';
import {
  useArtifactsInventory,
  type GoodArtifactRow,
} from '@/hooks/use-artifacts-inventory';
import {
  formatGoodLocationLabel,
  formatGoodSetName,
  formatGoodSlotLabel,
  formatGoodStatChip,
  formatGoodStatLabel,
} from '@/lib/good-labels';
import {rarityAccent} from '@/lib/genshin-visuals';

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

/** Avatar that tries primary CDN then fallback (Enka → HoYoLab). */
function CdnAvatar({
  icon,
  iconFallback,
  label,
  emptyFallback,
  size = 'sm',
}: {
  icon?: string;
  iconFallback?: string;
  label: string;
  emptyFallback: string;
  size?: 'sm' | 'lg';
}) {
  const [src, setSrc] = useState<string | undefined>(icon ?? iconFallback);
  const triedFallback = useRef(false);

  useEffect(() => {
    setSrc(icon ?? iconFallback);
    triedFallback.current = false;
  }, [icon, iconFallback]);

  return (
    <Avatar size={size}>
      {src ? (
        <AvatarImage
          src={src}
          alt={label}
          onError={() => {
            if (
              iconFallback &&
              src !== iconFallback &&
              !triedFallback.current
            ) {
              triedFallback.current = true;
              setSrc(iconFallback);
              return;
            }
            setSrc(undefined);
          }}
        />
      ) : null}
      <AvatarFallback>{emptyFallback}</AvatarFallback>
    </Avatar>
  );
}

function artifactRowKey(artifact: GoodArtifactRow): string {
  const subs = artifact.substats
    .map((sub) => `${sub.key}:${sub.value}`)
    .join(',');
  return [
    artifact.setKey,
    artifact.slotKey,
    artifact.level,
    artifact.rarity,
    artifact.mainStatKey,
    artifact.location,
    artifact.lock ? '1' : '0',
    subs,
  ].join('|');
}

const ArtifactCard = memo(function ArtifactCard({
  artifact,
}: {
  artifact: GoodArtifactRow;
}) {
  const accent = rarityAccent(artifact.rarity);
  const title = formatGoodSetName(artifact.setKey);
  const fallback = title.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'AR';
  const equippedNow = isEquipped(artifact.location);
  const locationLabel = formatGoodLocationLabel(artifact.location);
  const starred = Boolean(artifact.star);

  return (
    <div className="h-full *:h-full">
      <Card size="sm" data-rarity={accent ?? undefined}>
        <CardHeader>
          <div className="flex flex-row items-start gap-4">
            <CdnAvatar
              size="lg"
              icon={artifact.icon}
              iconFallback={artifact.iconFallback}
              label={title}
              emptyFallback={fallback}
            />
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {formatGoodSlotLabel(artifact.slotKey)} · +{artifact.level}
              </CardDescription>
              <RarityStars rarity={artifact.rarity} />
            </div>
          </div>
          {artifact.lock || starred ? (
            <CardAction>
              <div className="flex flex-wrap justify-end gap-1">
                {artifact.lock ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="destructive" aria-label="Locked">
                        <LockSimpleIcon
                          data-icon="inline-start"
                          weight="fill"
                        />
                        Locked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Locked in inventory</TooltipContent>
                  </Tooltip>
                ) : null}
                {starred ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" aria-label="Starred">
                        <StarIcon data-icon="inline-start" weight="fill" />
                        Starred
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Marked with a star</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {equippedNow ? (
            <div className="flex min-w-0 items-center gap-2">
              <CdnAvatar
                icon={artifact.locationIcon}
                iconFallback={artifact.locationIconFallback}
                label={locationLabel}
                emptyFallback={locationLabel.slice(0, 2).toUpperCase() || '?'}
              />
              <span className="truncate text-sm text-muted-foreground">
                {locationLabel}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <StatChip kind="plain">
              {formatGoodStatLabel(artifact.mainStatKey)}
            </StatChip>
            {artifact.substats.slice(0, 4).map((sub) => (
              <StatChip key={`${sub.key}-${sub.value}`} kind="plain">
                {formatGoodStatChip(sub.key, sub.value)}
              </StatChip>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export function ArtifactsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    busy,
    error,
    imported,
    source,
    version,
    importedAt,
    artifactCount,
    artifacts,
    refresh,
    importJson,
    clearInventory,
  } = useArtifactsInventory();

  const qParam = searchParams.get('q') ?? '';
  const slot = (searchParams.get('slot') ?? 'all') as SlotKey | 'all';
  const equipped = (searchParams.get('equipped') ?? 'all') as EquippedFilter;

  /** Local draft keeps typing snappy; URL sync is deferred. */
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

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      `Imported ${result.artifactCount ?? 0} artifact${
        (result.artifactCount ?? 0) === 1 ? '' : 's'
      }`,
    );
  };

  const onClear = async () => {
    const result = await clearInventory();
    if (!result.ok) {
      toast.error(result.error ?? 'Clear failed');
      return;
    }
    toast.success('Cleared imported artifacts');
  };

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

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept=".json,application/json"
      className="hidden"
      onChange={(event) => void onFileChange(event)}
    />
  );

  if (loading && !imported) {
    return (
      <Page>
        {fileInput}
        <PageHeading
          title="Artifacts"
          description={
            <span className="inline-block h-4 w-96 max-w-full">
              <Skeleton />
            </span>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled>
                <Spinner data-icon="inline-start" />
                Replace GOOD JSON
              </Button>
              <Button variant="destructive" disabled>
                <TrashIcon data-icon="inline-start" />
                Clear
              </Button>
            </div>
          }
        />
        <ArtifactsPageSkeleton />
      </Page>
    );
  }

  if (!imported) {
    return (
      <Page className="min-h-full flex-1 items-center justify-center">
        {fileInput}
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <DiamondsFourIcon />
            </EmptyMedia>
            <EmptyTitle>No GOOD inventory yet</EmptyTitle>
            <EmptyDescription>
              {error
                ? error
                : 'Export artifacts from a scanner or Genshin Optimizer as GOOD JSON, then import the file here. The full bag is not available from HoYoLab Battle Chronicle.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button disabled={busy} onClick={onPickFile}>
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UploadSimpleIcon data-icon="inline-start" />
              )}
              Import GOOD JSON
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
  }

  return (
    <Page>
      {fileInput}
      <PageHeading
        title="Artifacts"
        description="Import your full artifact inventory from a GOOD-format JSON export (HoYoLab does not expose the bag)."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy}
              onClick={onPickFile}
            >
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <UploadSimpleIcon data-icon="inline-start" />
              )}
              Replace GOOD JSON
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={busy}>
                  <TrashIcon data-icon="inline-start" />
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <TrashIcon />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Clear imported artifacts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the vault-encrypted GOOD inventory from this
                    device. You can import the export again later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={busy}
                    onClick={() => void onClear()}
                  >
                    {busy ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <TrashIcon data-icon="inline-start" />
                    )}
                    Clear inventory
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
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
