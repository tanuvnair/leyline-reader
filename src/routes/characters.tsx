import {useEffect, useState} from 'react';
import {toast} from 'sonner';
import {
  ArrowsClockwiseIcon,
  UsersIcon,
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
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
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
import {Page, PageHeading} from '@/components/page-heading';
import {useHoyoAccount} from '@/hooks/use-hoyo-account';
import {getLeyline} from '@/lib/leyline';

interface CharacterRow {
  id?: number;
  name?: string;
  element?: string;
  level?: number;
  rarity?: number;
  fetter?: number;
  actived_constellation_num?: number;
}

interface Enrichment {
  iconUrl?: string;
  vision?: string;
  weapon?: string;
  title?: string;
  description?: string;
}

export function CharactersPage() {
  return (
    <AccountGate>
      <CharactersLinked />
    </AccountGate>
  );
}

function CharactersLinked() {
  const {refresh: refreshAccount} = useHoyoAccount();
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [enrichment, setEnrichment] = useState<Record<string, Enrichment>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLeyline().data.characters();
      if (!result.ok) {
        const message = result.error ?? 'Failed to load characters';
        if (isNotLinkedError(message)) {
          await refreshAccount();
        }
        setError(message);
        setCharacters([]);
        return;
      }
      setCharacters((result.characters as CharacterRow[]) ?? []);
      setEnrichment((result.enrichment as Record<string, Enrichment>) ?? {});
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

  return (
    <Page>
      <PageHeading
        title="Characters"
        description="Roster from HoYoLab, enriched with genshin.dev catalog data"
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({length: 6}).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex flex-row items-start gap-4">
                  <div className="size-10">
                    <Skeleton variant="circle" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-5 w-32">
                      <Skeleton />
                    </div>
                    <div className="h-4 w-24">
                      <Skeleton />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <div className="h-5 w-14">
                    <Skeleton variant="pill" />
                  </div>
                  <div className="h-5 w-10">
                    <Skeleton variant="pill" />
                  </div>
                  <div className="h-5 w-24">
                    <Skeleton variant="pill" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {error && !isNotLinkedError(error) ? (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Could not load roster</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {characters.map((character) => {
            const name = character.name ?? 'Unknown';
            const meta = enrichment[name];
            return (
              <Card key={`${character.id ?? name}-${character.level}`}>
                <CardHeader>
                  <div className="flex flex-row items-start gap-4">
                    <Avatar size="lg">
                      {meta?.iconUrl ? (
                        <AvatarImage src={meta.iconUrl} alt={name} />
                      ) : null}
                      <AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <CardTitle>{name}</CardTitle>
                      <CardDescription>
                        {meta?.title ?? character.element ?? 'Traveler'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Lv. {character.level ?? '—'}</Badge>
                    <Badge variant="secondary">
                      C{character.actived_constellation_num ?? 0}
                    </Badge>
                    <Badge variant="outline">
                      Friendship {character.fetter ?? '—'}
                    </Badge>
                    {meta?.vision ? (
                      <Badge variant="outline">{meta.vision}</Badge>
                    ) : null}
                    {meta?.weapon ? (
                      <Badge variant="outline">{meta.weapon}</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
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
    </Page>
  );
}
