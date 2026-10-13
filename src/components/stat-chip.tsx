import type {ReactNode} from 'react';
import type {Icon} from '@phosphor-icons/react';
import {Badge} from '@/components/ui/badge';
import type {
  ConstellationBand,
  FriendshipBand,
  GenshinElement,
} from '@/lib/genshin-visuals';

type StatChipProps = {
  children: ReactNode;
  icon?: Icon;
} & (
  | {kind: 'element'; element: GenshinElement}
  | {kind: 'rarity'; rarity: number}
  | {kind: 'constellation'; band: ConstellationBand}
  | {kind: 'friendship'; band: FriendshipBand}
  | {kind: 'stat'; stat: 'chest' | 'achievement'}
  | {kind: 'plain'}
);

/** Domain Badge wrapper — colors come from theme tokens + data-* on Badge. */
export function StatChip(props: StatChipProps) {
  const {children, icon: Icon} = props;

  if (props.kind === 'plain') {
    return (
      <Badge variant="secondary">
        {Icon ? <Icon data-icon="inline-start" /> : null}
        {children}
      </Badge>
    );
  }

  const dataAttrs: Record<string, string | number> = {
    'data-genshin-chip': props.kind,
  };
  if (props.kind === 'element') {
    dataAttrs['data-element'] = props.element;
  } else if (props.kind === 'rarity') {
    dataAttrs['data-rarity'] = props.rarity;
  } else if (props.kind === 'constellation') {
    dataAttrs['data-constellation'] = props.band;
  } else if (props.kind === 'friendship') {
    dataAttrs['data-friendship'] = props.band;
  } else if (props.kind === 'stat') {
    dataAttrs['data-stat'] = props.stat;
  }

  return (
    <Badge variant="outline" {...dataAttrs}>
      {Icon ? <Icon data-icon="inline-start" /> : null}
      {children}
    </Badge>
  );
}
