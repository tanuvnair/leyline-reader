import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {
  LockSimpleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import {Badge} from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {CdnAvatar} from '@/components/cdn-avatar';
import {RarityStars} from '@/components/rarity-stars';
import {rarityAccent} from '@/lib/genshin-visuals';

export type InventoryEquippedBy = {
  name: string;
  icon?: string;
  iconFallback?: string;
};

export type InventoryItemCardProps = {
  /** Primary label (character / set / weapon / material name). */
  title: string;
  /**
   * Single identity / progress line under the title.
   * Must not repeat facts that also appear in `chips` (see AGENTS inventory cards).
   */
  description?: ReactNode;
  /** When set, shows RarityStars under description and tints Card via data-rarity. */
  rarity?: number | null;
  icon?: string;
  iconFallback?: string;
  /** Avatar alt text; defaults to title. */
  iconLabel?: string;
  /** Two-letter AvatarFallback when icons fail. */
  emptyFallback?: string;
  locked?: boolean;
  starred?: boolean;
  /** Equipped-by row; omit entirely when unequipped / N/A. */
  equipped?: InventoryEquippedBy | null;
  /**
   * Orthogonal facts as StatChip nodes — never Lv/Asc/R, count, or rarity
   * when those already live in description / RarityStars.
   */
  chips?: ReactNode;
  /** When set, wraps the icon + title stack in a HashRouter Link. */
  to?: string;
};

function initialsFromTitle(title: string): string {
  return title.replace(/[^A-Za-z]/g, '').slice(0, 2) || '?';
}

/**
 * Shared roster / inventory card shell for Characters, Artifacts, Weapons,
 * and Materials. Keeps header vs body roles consistent — see AGENTS.md.
 */
export function InventoryItemCard({
  title,
  description,
  rarity,
  icon,
  iconFallback,
  iconLabel,
  emptyFallback,
  locked = false,
  starred = false,
  equipped,
  chips,
  to,
}: InventoryItemCardProps) {
  const accent = rarityAccent(rarity);
  const fallback = emptyFallback ?? initialsFromTitle(title);
  const label = iconLabel ?? title;
  const showAction = locked || starred;
  const showContent = Boolean(equipped?.name.trim()) || Boolean(chips);
  const equippedName = equipped?.name.trim() ?? '';

  const titleBlock = (
    <>
      <CdnAvatar
        size="lg"
        icon={icon}
        iconFallback={iconFallback}
        label={label}
        emptyFallback={fallback}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
        {rarity != null && rarity > 0 ? (
          <RarityStars rarity={rarity} />
        ) : null}
      </div>
    </>
  );

  return (
    <div className="h-full *:h-full">
      <Card size="sm" data-rarity={accent ?? undefined}>
        <CardHeader>
          {to ? (
            <Link to={to} className="flex flex-row items-start gap-4">
              {titleBlock}
            </Link>
          ) : (
            <div className="flex flex-row items-start gap-4">{titleBlock}</div>
          )}
          {showAction ? (
            <CardAction>
              <div className="flex flex-wrap justify-end gap-1">
                {locked ? (
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
        {showContent ? (
          <CardContent>
            {equipped && equippedName ? (
              <div className="flex min-w-0 items-center gap-2">
                <CdnAvatar
                  icon={equipped.icon}
                  iconFallback={equipped.iconFallback}
                  label={equippedName}
                  emptyFallback={
                    equippedName.slice(0, 2).toUpperCase() || '?'
                  }
                />
                <span className="truncate text-sm text-muted-foreground">
                  {equippedName}
                </span>
              </div>
            ) : null}
            {chips ? (
              <div className="flex flex-wrap gap-2">{chips}</div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
