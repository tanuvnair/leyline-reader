import React from 'react';
import ReactDOM from 'react-dom/client';
import {ThemeProvider} from 'next-themes';
import {DirectionProvider} from '@/components/ui/direction';
import {TooltipProvider} from '@/components/ui/tooltip';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="leyline-theme"
    >
      <DirectionProvider dir="ltr">
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </DirectionProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

postMessage({payload: 'removeLoading'}, '*');
