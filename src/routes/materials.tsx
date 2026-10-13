import {memo, useDeferredValue, useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {toast} from 'sonner';
import {
  FlaskIcon,
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
import {Skeleton} from '@/components/ui/skeleton';
import {InventoryItemCard} from '@/components/inventory-item-card';
import {Page, PageHeading} from '@/components/page-heading';
import {MaterialsPageSkeleton} from '@/components/page-skeletons';
import {StatChip} from '@/components/stat-chip';
import {
  useGoodInventory,
  type GoodMaterialRow,
} from '@/hooks/use-good-inventory';
import {
  formatGoodMaterialName,
  formatMaterialCategoryLabel,
} from '@/lib/good-labels';

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

function formatCount(count: number): string {
  return count.toLocaleString();
}

const MaterialCard = memo(function MaterialCard({
  material,
}: {
  material: GoodMaterialRow;
}) {
  const name = formatGoodMaterialName(material.key);
  const category = material.category?.trim() ?? '';

  return (
    <InventoryItemCard
      title={name}
      description={`×${formatCount(material.count)}`}
      rarity={material.rarity}
      icon={material.icon}
      iconFallback={material.iconFallback}
      chips={
        category ? (
          <StatChip kind="plain">
            {formatMaterialCategoryLabel(category)}
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
            <FlaskIcon />
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

export function MaterialsPage() {
  const {
    loading,
    error,
    imported,
    source,
    version,
    importedAt,
    materialCount,
    materials,
    refresh,
  } = useGoodInventory();

  const [qInput, setQInput] = useState('');
  const deferredQuery = useDeferredValue(qInput);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    });
  }, [refresh]);

  const indexed = useMemo(
    () =>
      materials.map((material) => ({
        material,
        haystack: [
          material.key,
          material.category ?? '',
          formatGoodMaterialName(material.key),
          material.category
            ? formatMaterialCategoryLabel(material.category)
            : '',
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [materials],
  );

  const filtered = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();
    if (!query) {
      return indexed;
    }
    return indexed.filter(({haystack}) => haystack.includes(query));
  }, [deferredQuery, indexed]);

  if (loading && !imported) {
    return (
      <Page>
        <PageHeading
          title="Materials"
          description={
            <span className="inline-block h-4 w-96 max-w-full">
              <Skeleton />
            </span>
          }
        />
        <MaterialsPageSkeleton />
      </Page>
    );
  }

  if (!imported) {
    return (
      <InventorySettingsCta
        title="No GOOD inventory yet"
        description={
          error ??
          'Import a GOOD JSON export in Settings. Materials require an export that includes a materials map (not all scanners do).'
        }
      />
    );
  }

  if (materialCount === 0) {
    return (
      <InventorySettingsCta
        title="No materials in this import"
        description="Canonical GOOD (Genshin Optimizer) often omits materials. Use a scanner export that includes a materials key→count map, then replace the inventory in Settings."
      />
    );
  }

  return (
    <Page>
      <PageHeading
        title="Materials"
        description="Browse material counts from your vault-encrypted GOOD inventory when the export includes them."
      />

      {error ? (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertTitle>Materials error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <FlaskIcon />
        <AlertTitle>GOOD inventory loaded</AlertTitle>
        <AlertDescription>
          {materialCount} material{materialCount === 1 ? '' : 's'} from{' '}
          {source ?? 'unknown'} (v{version ?? '?'}) · imported{' '}
          {formatImportedAt(importedAt)}.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="materials-q">Search</FieldLabel>
          <Input
            id="materials-q"
            value={qInput}
            placeholder="Material or category…"
            onChange={(event) => setQInput(event.target.value)}
          />
        </Field>
      </FieldGroup>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({material}) => (
            <MaterialCard key={material.key} material={material} />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskIcon />
            </EmptyMedia>
            <EmptyTitle>No materials match search</EmptyTitle>
            <EmptyDescription>Try a different search term.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </Page>
  );
}
