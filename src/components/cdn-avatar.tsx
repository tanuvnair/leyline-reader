import {useEffect, useRef, useState} from 'react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';

/**
 * Avatar that tries primary CDN then fallback (Enka → HoYoLab).
 * Used by inventory roster cards for item + equipped-by icons.
 */
export function CdnAvatar({
  icon,
  iconFallback,
  label,
  emptyFallback,
  size = 'sm',
}: {
  icon?: string;
  iconFallback?: string;
  label: string;
  emptyFallback: string;
  size?: 'sm' | 'lg';
}) {
  const [src, setSrc] = useState<string | undefined>(icon ?? iconFallback);
  const triedFallback = useRef(false);

  useEffect(() => {
    setSrc(icon ?? iconFallback);
    triedFallback.current = false;
  }, [icon, iconFallback]);

  return (
    <Avatar size={size}>
      {src ? (
        <AvatarImage
          src={src}
          alt={label}
          onError={() => {
            if (
              iconFallback &&
              src !== iconFallback &&
              !triedFallback.current
            ) {
              triedFallback.current = true;
              setSrc(iconFallback);
            } else {
              setSrc(undefined);
            }
          }}
        />
      ) : null}
      <AvatarFallback>{emptyFallback}</AvatarFallback>
    </Avatar>
  );
}
