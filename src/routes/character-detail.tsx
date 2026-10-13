import {useEffect} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {
  ArrowLeftIcon,
  HeartIcon,
  MapPinIcon,
  SparkleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {Skeleton} from '@/components/ui/skeleton';
import {
  AccountGate,
  isNotLinkedError,
} from '@/components/account-setup-empty';
import {Page, PageHeading} from '@/components/page-heading';
import {CharacterDetailCardSkeleton} from '@/components/page-skeletons';
import {RarityStars} from '@/components/rarity-stars';
import {StatChip} from '@/components/stat-chip';
import {useCharacterRoster} from '@/hooks/use-character-roster';
import {
  characterAvatarSrc,
  constellationBand,
  friendshipBand,
  normalizeElement,
  rarityAccent,
} from '@/lib/genshin-visuals';

export function CharacterDetailPage() {
  return (
    <AccountGate>
      <CharacterDetailLinked />
    </AccountGate>
  );
}

function BackLink({to}: {to: {pathname: string; search: string}}) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to={to}>
        <ArrowLeftIcon data-icon="inline-start" />
        Back
      </Link>
    </Button>
  );
}

function CharacterDetailLinked() {
  const {characterKey = ''} = useParams();
  const [searchParams] = useSearchParams();
  const {loading, error, refresh, findByKey} = useCharacterRoster();

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    });
  }, [refresh]);

  const match = characterKey ? findByKey(characterKey) : null;
  const backSearch = searchParams.toString();
  const backTo = {
    pathname: '/characters',
    search: backSearch ? `?${backSearch}` : '',
  };

  if (loading && !match) {
    return (
      <Page>
        <PageHeading
          title={
            <span className="inline-block h-9 w-40">
              <Skeleton />
            </span>
          }
          description={
            <span className="inline-block h-4 w-48">
              <Skeleton />
            </span>
          }
          leading={<BackLink to={backTo} />}
        />
        <CharacterDetailCardSkeleton />
      </Page>
    );
  }

  if (error && !isNotLinkedError(error)) {
    return (
      <Page>
        <PageHeading title="Character" leading={<BackLink to={backTo} />} />
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Could not load roster</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Page>
    );
  }

  if (!match) {
    return (
      <Page>
        <PageHeading title="Character" leading={<BackLink to={backTo} />} />
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WarningCircleIcon />
            </EmptyMedia>
            <EmptyTitle>Character not found</EmptyTitle>
            <EmptyDescription>
              This character is not in the cached roster. Return to the list and
              refresh.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Page>
    );
  }

  const {character, meta} = match;
  const name = character.name ?? 'Unknown';
  const elementKey = normalizeElement(meta?.vision ?? character.element);
  const rarity = meta?.rarity ?? character.rarity;
  const accent = rarityAccent(rarity);
  const avatarSrc = characterAvatarSrc(character, meta);

  return (
    <Page>
      <PageHeading
        title={name}
        description={meta?.title ?? character.element ?? 'Roster character'}
        leading={<BackLink to={backTo} />}
      />

      <Card size="sm" data-rarity={accent ?? undefined}>
        <CardHeader>
          <div className="flex flex-row items-start gap-4">
            <Avatar size="lg">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
              <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle>{name}</CardTitle>
              <CardDescription>
                {meta?.title ?? 'No catalog title'}
              </CardDescription>
              {rarity ? <RarityStars rarity={rarity} /> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <StatChip kind="plain">Lv. {character.level ?? '—'}</StatChip>
            <StatChip
              kind="constellation"
              band={constellationBand(character.actived_constellation_num)}
              icon={SparkleIcon}
            >
              C{character.actived_constellation_num ?? 0}
            </StatChip>
            <StatChip
              kind="friendship"
              band={friendshipBand(character.fetter)}
              icon={HeartIcon}
            >
              Friendship {character.fetter ?? '—'}
            </StatChip>
            <StatChip kind="element" element={elementKey}>
              {elementKey.charAt(0).toUpperCase() + elementKey.slice(1)}
            </StatChip>
            {meta?.weapon || character.weapon ? (
              <StatChip kind="plain">
                {meta?.weapon ?? character.weapon}
              </StatChip>
            ) : null}
            {meta?.nation ? (
              <StatChip kind="plain" icon={MapPinIcon}>
                {meta.nation}
              </StatChip>
            ) : null}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-col gap-1">
            <CardDescription>
              {meta?.description ??
                'Catalog description unavailable for this character.'}
            </CardDescription>
            {meta?.constellation ? (
              <CardDescription>
                Constellation: {meta.constellation}
              </CardDescription>
            ) : null}
            {meta?.birthday ? (
              <CardDescription>Birthday: {meta.birthday}</CardDescription>
            ) : null}
          </div>
        </CardFooter>
      </Card>
    </Page>
  );
}
