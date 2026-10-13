import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {Field, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Skeleton} from '@/components/ui/skeleton';

/** Matches MetricCard: description + CardAction icon, value, reserved footer. */
export function MetricCardSkeleton({
  footer = 'default',
}: {
  footer?: 'default' | 'rich';
}) {
  return (
    <div className="h-full *:h-full">
      <Card data-footer={footer}>
        <CardHeader>
          <div className="h-4 w-24">
            <Skeleton />
          </div>
          <CardAction>
            <div className="size-4">
              <Skeleton variant="circle" />
            </div>
          </CardAction>
          <div className="h-7 w-28">
            <Skeleton />
          </div>
        </CardHeader>
        <CardFooter>
          <div className="flex w-full flex-col gap-2">
            <div className={footer === 'rich' ? 'h-8 w-full' : 'h-4 w-36'}>
              <Skeleton />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/** Filter row on Characters (search + 3 selects). */
export function CharacterFiltersSkeleton() {
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 4}).map((_, index) => (
          <Field key={index}>
            <FieldLabel>
              <span className="inline-block h-4 w-16">
                <Skeleton />
              </span>
            </FieldLabel>
            <div className="h-9 w-full">
              <Skeleton />
            </div>
          </Field>
        ))}
      </div>
    </FieldGroup>
  );
}

/** Roster card: avatar, title, subtitle, rarity stars, chip row. */
export function CharacterRosterCardSkeleton() {
  return (
    <div className="h-full *:h-full">
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-row items-start gap-4">
            <div className="size-10">
              <Skeleton variant="circle" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="h-5 w-28">
                <Skeleton />
              </div>
              <div className="h-4 w-20">
                <Skeleton />
              </div>
              <div className="h-5 w-24">
                <Skeleton variant="pill" />
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
            <div className="h-5 w-12">
              <Skeleton variant="pill" />
            </div>
            <div className="h-5 w-16">
              <Skeleton variant="pill" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Detail page body under PageHeading (avatar, chips, description footer). */
export function CharacterDetailCardSkeleton() {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex flex-row items-start gap-4">
          <div className="size-10">
            <Skeleton variant="circle" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="h-5 w-36">
              <Skeleton />
            </div>
            <div className="h-4 w-48">
              <Skeleton />
            </div>
            <div className="h-5 w-28">
              <Skeleton variant="pill" />
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
          <div className="h-5 w-28">
            <Skeleton variant="pill" />
          </div>
          <div className="h-5 w-16">
            <Skeleton variant="pill" />
          </div>
          <div className="h-5 w-20">
            <Skeleton variant="pill" />
          </div>
          <div className="h-5 w-20">
            <Skeleton variant="pill" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full flex-col gap-1">
          <div className="h-4 w-full">
            <Skeleton />
          </div>
          <div className="h-4 w-64 max-w-full">
            <Skeleton />
          </div>
          <div className="h-4 w-40 max-w-full">
            <Skeleton />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

/** World progress chip cloud under Overview metrics. */
export function WorldProgressCardSkeleton() {
  return (
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
          {Array.from({length: 10}).map((_, index) => (
            <div key={index} className="h-5 w-28">
              <Skeleton variant="pill" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Filter row on Artifacts (search + slot + equipped). */
export function ArtifactsFiltersSkeleton() {
  return (
    <FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({length: 3}).map((_, index) => (
          <Field key={index}>
            <FieldLabel>
              <span className="inline-block h-4 w-16">
                <Skeleton />
              </span>
            </FieldLabel>
            <div className="h-9 w-full">
              <Skeleton />
            </div>
          </Field>
        ))}
      </div>
    </FieldGroup>
  );
}

/**
 * Artifact card: avatar, set title, slot/level, rarity, equipped badge, stats.
 * Matches live Artifacts grid cards (status badges + StatChip row).
 */
export function ArtifactCardSkeleton() {
  return (
    <div className="h-full *:h-full">
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-row items-start gap-4">
            <div className="size-10">
              <Skeleton variant="circle" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="h-5 w-40">
                <Skeleton />
              </div>
              <div className="h-4 w-24">
                <Skeleton />
              </div>
              <div className="h-5 w-24">
                <Skeleton variant="pill" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-16">
              <Skeleton variant="pill" />
            </div>
            <div className="h-5 w-14">
              <Skeleton variant="pill" />
            </div>
            <div className="h-5 w-20">
              <Skeleton variant="pill" />
            </div>
            <div className="h-5 w-12">
              <Skeleton variant="pill" />
            </div>
            <div className="h-5 w-16">
              <Skeleton variant="pill" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Artifacts body under PageHeading: status banner, filters, card grid. */
export function ArtifactsPageSkeleton() {
  return (
    <>
      <div className="h-16 w-full rounded-lg">
        <Skeleton />
      </div>
      <ArtifactsFiltersSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({length: 6}).map((_, index) => (
          <ArtifactCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

/** Weapons browse: banner + filters + card grid (same rhythm as Artifacts). */
export function WeaponsPageSkeleton() {
  return <ArtifactsPageSkeleton />;
}

/** Materials browse: banner + search + denser card grid with icons. */
export function MaterialsPageSkeleton() {
  return (
    <>
      <div className="h-16 w-full rounded-lg">
        <Skeleton />
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel>
            <span className="inline-block h-4 w-16">
              <Skeleton />
            </span>
          </FieldLabel>
          <div className="h-9 w-full max-w-md">
            <Skeleton />
          </div>
        </Field>
      </FieldGroup>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({length: 8}).map((_, index) => (
          <div key={index} className="h-full *:h-full">
            <Card size="sm">
              <CardHeader>
                <div className="flex flex-row items-start gap-4">
                  <div className="size-10">
                    <Skeleton variant="circle" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="h-5 w-28">
                      <Skeleton />
                    </div>
                    <div className="h-4 w-16">
                      <Skeleton />
                    </div>
                    <div className="h-5 w-20">
                      <Skeleton variant="pill" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <div className="h-5 w-12">
                    <Skeleton variant="pill" />
                  </div>
                  <div className="h-5 w-10">
                    <Skeleton variant="pill" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
