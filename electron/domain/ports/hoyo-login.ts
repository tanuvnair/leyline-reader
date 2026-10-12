import type {HoyoCookiePayload} from '../account/types';

/** Opens the isolated HoYoverse login window and returns captured cookies. */
export interface HoyoLoginPort {
  captureCookies(parentWindow: unknown): Promise<HoyoCookiePayload>;
}
