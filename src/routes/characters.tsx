import {useEffect, useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
  ArrowsClockwiseIcon,
  HeartIcon,
  SparkleIcon,
  UsersIcon,
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
import {Spinner} from '@/components/ui/spinner';
import {
  AccountGate,
  isNotLinkedError,
} from '@/components/account-setup-empty';
import {InventoryItemCard} from '@/components/inventory-item-card';
import {Page, PageHeading} from '@/components/page-heading';
import {
  CharacterFiltersSkeleton,
  CharacterRosterCardSkeleton,
} from '@/components/page-skeletons';
import {StatChip} from '@/components/stat-chip';
import {
  useCharacterRoster,
  type CharacterRow,
} from '@/hooks/use-character-roster';
import {
  ELEMENTS,
  WEAPONS,
  characterAvatarSrc,
  characterRouteKey,
  constellationBand,
  friendshipBand,
  normalizeElement,
  normalizeWeapon,
  type CharacterSort,
  type GenshinElement,
} from '@/lib/genshin-visuals';

export function CharactersPage() {
  return (
    <AccountGate>
      <CharactersLinked />
    </AccountGate>
  );
}

function CharactersLinked() {
  const {loading, error, characters, enrichment, refresh} =
    useCharacterRoster();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const element = (searchParams.get('element') ?? 'all') as GenshinElement | 'all';
  const weapon = searchParams.get('weapon') ?? 'all';
  const sort = (searchParams.get('sort') ?? 'level-desc') as CharacterSort;

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    });
  }, [refresh]);

  const setParam = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const isDefault =
          !value ||
          value === 'all' ||
          (key === 'sort' && value === 'level-desc');
        if (isDefault) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        return next;
      },
      {replace: true},
    );
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = characters.filter((character) => {
      const name = character.name ?? '';
      const meta = enrichment[name];
      const el = normalizeElement(meta?.vision ?? character.element);
      const w = normalizeWeapon(meta?.weapon ?? character.weapon);
      if (query && !name.toLowerCase().includes(query)) {
        return false;
      }
      if (element !== 'all' && el !== element) {
        return false;
      }
      if (weapon !== 'all' && w !== normalizeWeapon(weapon)) {
        return false;
      }
      return true;
    });

    rows = [...rows].sort((a, b) => compareCharacters(a, b, sort, enrichment));
    return rows;
  }, [characters, enrichment, element, q, sort, weapon]);

  const onRefresh = async () => {
    try {
      await refresh({force: true});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  return (
    <Page>
      <PageHeading
        title="Characters"
        description="Roster from HoYoLab, enriched with genshin.dev catalog data"
        actions={
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void onRefresh()}
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

      {!(loading && characters.length === 0) ? (
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field>
            <FieldLabel htmlFor="character-q">Search</FieldLabel>
            <Input
              id="character-q"
              value={q}
              placeholder="Name…"
              onChange={(e) => setParam('q', e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Element</FieldLabel>
            <div className="w-full *:w-full">
              <Select
                value={element}
                onValueChange={(value) => setParam('element', value ?? 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All elements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All elements</SelectItem>
                    {ELEMENTS.map((el) => (
                      <SelectItem key={el} value={el}>
                        {el.charAt(0).toUpperCase() + el.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <Field>
            <FieldLabel>Weapon</FieldLabel>
            <div className="w-full *:w-full">
              <Select
                value={weapon}
                onValueChange={(value) => setParam('weapon', value ?? 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All weapons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All weapons</SelectItem>
                    {WEAPONS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <Field>
            <FieldLabel>Sort</FieldLabel>
            <div className="w-full *:w-full">
              <Select
                value={sort}
                onValueChange={(value) =>
                  setParam('sort', (value as CharacterSort) ?? 'level-desc')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="level-desc">Level</SelectItem>
                    <SelectItem value="rarity-desc">Rarity</SelectItem>
                    <SelectItem value="friendship-desc">Friendship</SelectItem>
                    <SelectItem value="constellation-desc">
                      Constellation
                    </SelectItem>
                    <SelectItem value="name-asc">Name</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Field>
        </div>
      </FieldGroup>
      ) : null}

      {loading && characters.length === 0 ? (
        <>
          <CharacterFiltersSkeleton />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({length: 6}).map((_, index) => (
              <CharacterRosterCardSkeleton key={index} />
            ))}
          </div>
        </>
      ) : null}

      {error && !isNotLinkedError(error) ? (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Could not load roster</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading || characters.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((character) => {
            const name = character.name ?? 'Unknown';
            const meta = enrichment[name];
            const elementKey = normalizeElement(
              meta?.vision ?? character.element,
            );
            const rarity = meta?.rarity ?? character.rarity;
            const key = characterRouteKey(character);
            const search = searchParams.toString();
            const avatarSrc = characterAvatarSrc(character, meta);
            const href = `/characters/${key}${search ? `?${search}` : ''}`;
            return (
              <InventoryItemCard
                key={`${character.id ?? name}-${character.level}`}
                title={name}
                description={meta?.title ?? 'Character'}
                rarity={rarity}
                icon={avatarSrc}
                emptyFallback={name.slice(0, 2)}
                to={href}
                chips={
                  <>
                    <StatChip kind="plain">
                      Lv. {character.level ?? '—'}
                    </StatChip>
                    <StatChip
                      kind="constellation"
                      band={constellationBand(
                        character.actived_constellation_num,
                      )}
                      icon={SparkleIcon}
                    >
                      C{character.actived_constellation_num ?? 0}
                    </StatChip>
                    <StatChip
                      kind="friendship"
                      band={friendshipBand(character.fetter)}
                      icon={HeartIcon}
                    >
                      {character.fetter ?? '—'}
                    </StatChip>
                    <StatChip kind="element" element={elementKey}>
                      {elementKey.charAt(0).toUpperCase() +
                        elementKey.slice(1)}
                    </StatChip>
                    {meta?.weapon || character.weapon ? (
                      <StatChip kind="plain">
                        {meta?.weapon ?? character.weapon}
                      </StatChip>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </div>
      ) : null}

      {!loading && !error && characters.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No characters returned</EmptyTitle>
            <EmptyDescription>
              HoYoLab did not return a roster. Confirm Battle Chronicle is
              public for your account, then refresh.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!loading && !error && characters.length > 0 && filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>
              Try clearing search or filters.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </Page>
  );
}

function compareCharacters(
  a: CharacterRow,
  b: CharacterRow,
  sort: CharacterSort,
  enrichment: Record<string, {rarity?: number}>,
): number {
  const rarityA = enrichment[a.name ?? '']?.rarity ?? a.rarity ?? 0;
  const rarityB = enrichment[b.name ?? '']?.rarity ?? b.rarity ?? 0;
  switch (sort) {
    case 'rarity-desc':
      return rarityB - rarityA || (b.level ?? 0) - (a.level ?? 0);
    case 'friendship-desc':
      return (b.fetter ?? 0) - (a.fetter ?? 0);
    case 'constellation-desc':
      return (
        (b.actived_constellation_num ?? 0) - (a.actived_constellation_num ?? 0)
      );
    case 'name-asc':
      return (a.name ?? '').localeCompare(b.name ?? '');
    case 'level-desc':
    default:
      return (b.level ?? 0) - (a.level ?? 0);
  }
}
