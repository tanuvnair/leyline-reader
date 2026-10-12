import React from 'react';
import ReactDOM from 'react-dom/client';
import {DirectionProvider} from '@/components/ui/direction';
import {TooltipProvider} from '@/components/ui/tooltip';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DirectionProvider dir="ltr">
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </DirectionProvider>
  </React.StrictMode>,
);

postMessage({payload: 'removeLoading'}, '*');
