import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

export function PageHeading({
  title,
  description,
  actions,
  leading,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Control to the left of the title (e.g. Back). */
  leading?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {leading ? <div className="shrink-0 pt-1">{leading}</div> : null}
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Full-width page shell inside the sidebar inset. Do not add max-width / mx-auto. */
export function Page({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-8', className)}>{children}</div>
  );
}
