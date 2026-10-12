/** Sanitized character row for the renderer (no cookie/token fields). */
export interface CharacterDto {
  id?: number;
  name?: string;
  element?: string;
  level?: number;
  rarity?: number;
  fetter?: number;
  actived_constellation_num?: number;
  icon?: string;
}

export type DailyNoteResult =
  | {ok: true; data: Record<string, unknown>}
  | {ok: false; error: string};

export function friendlyDailyNoteError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes('not public') ||
    lower.includes('data is not public') ||
    lower.includes('real-time')
  ) {
    return 'Real-Time Notes are not enabled. In the HoYoLAB app, open Battle Chronicle, turn on Real-Time Notes, then refresh here.';
  }
  return message;
}
