import {StarIcon} from '@phosphor-icons/react';
import {Badge} from '@/components/ui/badge';

/** Rarity as a Badge of filled stars (Moegirl rarity token via data-rarity). */
export function RarityStars({
  rarity,
  max = 5,
}: {
  rarity: number;
  max?: number;
}) {
  const filled = Math.max(0, Math.min(max, Math.floor(rarity)));
  if (filled <= 0) {
    return null;
  }
  const band = filled >= 5 ? 5 : filled >= 4 ? 4 : filled;
  return (
    <Badge
      variant="outline"
      data-genshin-chip="rarity"
      data-rarity={band}
      aria-label={`${filled} star`}
    >
      {Array.from({length: filled}).map((_, index) => (
        <StarIcon key={index} weight="fill" />
      ))}
    </Badge>
  );
}
