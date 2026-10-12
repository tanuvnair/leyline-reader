import type {ReactNode} from 'react';
import {TitleBar} from '@/components/title-bar';

export function AppFrame({children}: {children: ReactNode}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1 flex-col pt-titlebar">
        {children}
      </div>
    </div>
  );
}
