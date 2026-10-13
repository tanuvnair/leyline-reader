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
  AxeIcon,
  CrosshairIcon,
  GearIcon,
  MagicWandIcon,
  SwordIcon,
  WarningCircleIcon,
  type Icon,
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
import {WeaponsPageSkeleton} from '@/components/page-skeletons';
import {StatChip} from '@/components/stat-chip';
import {
  useGoodInventory,
  type GoodWeaponRow,
} from '@/hooks/use-good-inventory';
import {
  formatGoodLocationLabel,
  formatGoodWeaponName,
  formatGoodWeaponTypeLabel,
} from '@/lib/good-labels';

const WEAPON_TYPES = [
  'sword',
  'claymore',
  'polearm',
  'bow',
  'catalyst',
] as const;

type WeaponType = (typeof WEAPON_TYPES)[number];
type EquippedFilter = 'all' | 'yes' | 'no';
type LockFilter = 'all' | 'yes' | 'no';

const WEAPON_TYPE_ICONS: Record<WeaponType, Icon> = {
  sword: SwordIcon,
  claymore: AxeIcon,
  polearm: SwordIcon,
  bow: CrosshairIcon,
  catalyst: MagicWandIcon,
};

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

function weaponRowKey(weapon: GoodWeaponRow, index: number): string {
  return [
    weapon.key,
    weapon.level,
    weapon.ascension,
    weapon.refinement,
    weapon.location,
    String(index),
  ].join('::');
}

const WeaponCard = memo(function WeaponCard({
  weapon,
}: {
  weapon: GoodWeaponRow;
}) {
  const name = formatGoodWeaponName(weapon.key);
  const locationLabel = formatGoodLocationLabel(weapon.location);
  const equipped = isEquipped(weapon.location);
  const weaponType = weapon.weaponType;
  const TypeIcon = weaponType ? WEAPON_TYPE_ICONS[weaponType] : SwordIcon;

  return (
    <InventoryItemCard
      title={name}
      description={`Lv ${weapon.level} · Ascension ${weapon.ascension} · R${weapon.refinement}`}
      rarity={weapon.rarity}
      icon={weapon.icon}
      iconFallback={weapon.iconFallback}
      locked={weapon.lock}
      equipped={
        equipped
          ? {
              name: locationLabel,
              icon: weapon.locationIcon,
              iconFallback: weapon.locationIconFallback,
            }
          : null
      }
      chips={
        weaponType ? (
          <StatChip kind="plain" icon={TypeIcon}>
            {formatGoodWeaponTypeLabel(weaponType)}
          </StatChip>
        ) : null
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
            <SwordIcon />
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

export function WeaponsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    error,
    imported,
    source,
    version,
    importedAt,
    weaponCount,
    weapons,
    refresh,
  } = useGoodInventory();

  const qParam = searchParams.get('q') ?? '';
  const type = (searchParams.get('type') ?? 'all') as WeaponType | 'all';
  const equipped = (searchParams.get('equipped') ?? 'all') as EquippedFilter;
  const locked = (searchParams.get('locked') ?? 'all') as LockFilter;

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
      weapons.map((weapon, index) => ({
        weapon,
        key: weaponRowKey(weapon, index),
        haystack: [
          weapon.key,
          weapon.location,
          weapon.weaponType ?? '',
          formatGoodWeaponName(weapon.key),
          formatGoodLocationLabel(weapon.location),
          weapon.weaponType
            ? formatGoodWeaponTypeLabel(weapon.weaponType)
            : '',
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [weapons],
  );

  const filtered = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    return indexed.filter(({weapon, haystack}) => {
      if (type !== 'all' && weapon.weaponType !== type) {
        return false;
      }
      const equippedNow = isEquipped(weapon.location);
      if (equipped === 'yes' && !equippedNow) {
        return false;
      }
      if (equipped === 'no' && equippedNow) {
        return false;
      }
      if (locked === 'yes' && !weapon.lock) {
        return false;
      }
      if (locked === 'no' && weapon.lock) {
        return false;
      }
      if (!query) {
        return true;
      }
      return haystack.includes(query);
    });
  }, [deferredQuery, equipped, indexed, locked, type]);

  if (loading && !imported) {
    return (
      <Page>
        <PageHeading
          title="Weapons"
          description={
            <span className="inline-block h-4 w-96 max-w-full">
              <Skeleton />
            </span>
          }
        />
        <WeaponsPageSkeleton />
      </Page>
    );
  }

  if (!imported) {
    return (
      <InventorySettingsCta
        title="No GOOD inventory yet"
        description={
          error ??
          'Import a GOOD JSON export in Settings to browse weapons. HoYoLab Battle Chronicle does not expose the weapon bag.'
        }
      />
    );
  }

  if (weaponCount === 0) {
    return (
      <InventorySettingsCta
        title="No weapons in this import"
        description="Your GOOD file had no weapons[]. Re-export with weapons included (Genshin Optimizer, Irminsul, Inventory Kamera), then replace the inventory in Settings."
      />
    );
  }

  return (
    <Page>
      <PageHeading
        title="Weapons"
        description="Browse weapons from your vault-encrypted GOOD inventory. Import and clear live in Settings."
      />

      {error ? (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Weapons error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <SwordIcon />
        <AlertTitle>GOOD inventory loaded</AlertTitle>
        <AlertDescription>
          {weaponCount} weapon{weaponCount === 1 ? '' : 's'} from{' '}
          {source ?? 'unknown'} (v{version ?? '?'}) · imported{' '}
          {formatImportedAt(importedAt)}.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="weapons-q">Search</FieldLabel>
            <Input
              id="weapons-q"
              value={qInput}
              placeholder="Weapon or character…"
              onChange={(event) => setQInput(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={type}
              onValueChange={(value) => setParam('type', value ?? 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All types</SelectItem>
                  {WEAPON_TYPES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {formatGoodWeaponTypeLabel(key)}
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
          <Field>
            <FieldLabel>Locked</FieldLabel>
            <Select
              value={locked}
              onValueChange={(value) => setParam('locked', value ?? 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Locked</SelectItem>
                  <SelectItem value="no">Unlocked</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldGroup>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(({weapon, key}) => (
            <WeaponCard key={key} weapon={weapon} />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SwordIcon />
            </EmptyMedia>
            <EmptyTitle>No weapons match filters</EmptyTitle>
            <EmptyDescription>
              Try clearing search, type, equipped, or locked filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Page>
  );
}
