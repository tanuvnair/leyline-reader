import {useEffect, useState} from 'react';
import {
  CopySimpleIcon,
  MinusIcon,
  SquareIcon,
  XIcon,
} from '@phosphor-icons/react';
import {Button} from '@/components/ui/button';
import {getLeyline} from '@/lib/leyline';

export function TitleBar() {
  const [title, setTitle] = useState('Leyline Reader');
  const [maximized, setMaximized] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    void (async () => {
      try {
        const config = await getLeyline().getPublicConfig();
        setTitle(config.productName);
        setEnabled(config.window.customTitleBar);
        document.documentElement.style.setProperty(
          '--titlebar-height',
          `${config.window.titleBarHeight}px`,
        );
        setMaximized(await getLeyline().window.isMaximized());
        unsubscribe = getLeyline().window.onMaximizedChanged(setMaximized);
      } catch {
        setEnabled(false);
      }
    })();
    return () => unsubscribe();
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <header className="app-drag titlebar-h fixed inset-x-0 top-0 z-50 flex items-center border-b bg-card text-card-foreground">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <span className="font-heading truncate text-sm font-medium">
          {title}
        </span>
      </div>
      <div className="app-no-drag flex h-full">
        <Button
          type="button"
          variant="titlebar"
          size="titlebar"
          aria-label="Minimize"
          onClick={() => void getLeyline().window.minimize()}
        >
          <MinusIcon />
        </Button>
        <Button
          type="button"
          variant="titlebar"
          size="titlebar"
          aria-label={maximized ? 'Restore' : 'Maximize'}
          onClick={() => void getLeyline().window.maximize()}
        >
          {maximized ? <CopySimpleIcon /> : <SquareIcon />}
        </Button>
        <Button
          type="button"
          variant="titlebar-close"
          size="titlebar"
          aria-label="Close"
          onClick={() => void getLeyline().window.close()}
        >
          <XIcon />
        </Button>
      </div>
    </header>
  );
}
