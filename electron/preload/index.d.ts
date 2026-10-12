import type {LeylineApi} from './index';

declare global {
  interface Window {
    leyline: LeylineApi;
  }
}

export {};
