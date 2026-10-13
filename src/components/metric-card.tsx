import type {ReactNode} from 'react';
import type {Icon} from '@phosphor-icons/react';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {GenshinMetric} from '@/lib/genshin-visuals';

export function MetricCard({
  metric,
  title,
  value,
  hint,
  icon: Icon,
  muted,
  tone,
  footer = 'default',
  children,
}: {
  metric: GenshinMetric;
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: Icon;
  muted?: boolean;
  tone?: 'high' | 'low' | 'muted';
  /** Reserves taller footer space so a metric row stays even (e.g. Abyss stars). */
  footer?: 'default' | 'rich';
  children?: ReactNode;
}) {
  return (
    <div className="h-full *:h-full">
      <Card
        data-metric={metric}
        data-muted={muted ? '' : undefined}
        data-tone={tone}
        data-footer={footer}
      >
        <CardHeader>
          <CardDescription>{title}</CardDescription>
          {Icon ? (
            <CardAction>
              <Icon />
            </CardAction>
          ) : null}
          <CardTitle>{value}</CardTitle>
        </CardHeader>
        <CardFooter>
          <div className="flex w-full flex-col gap-2">
            {hint ? <CardDescription>{hint}</CardDescription> : null}
            {children}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
