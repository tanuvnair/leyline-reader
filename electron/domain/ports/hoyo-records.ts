import type {LinkedAccountMeta} from '../account/types';
import type {CharacterDto, DailyNoteResult} from '../hoyo/types';

export interface HoyoRecordsCredentials {
  cookie: string;
  uid?: number;
  language: string;
  bbsApiBase: string;
  characterListPath: string;
}

/** Remote Genshin record API (HoYoLab). */
export interface HoyoRecordsPort {
  validateAndLink(credentials: HoyoRecordsCredentials): Promise<LinkedAccountMeta>;
  fetchGameRecord(credentials: HoyoRecordsCredentials): Promise<unknown>;
  fetchCharacters(credentials: HoyoRecordsCredentials): Promise<CharacterDto[]>;
  fetchDailyNote(credentials: HoyoRecordsCredentials): Promise<DailyNoteResult>;
  fetchSpiralAbyss(
    credentials: HoyoRecordsCredentials,
    scheduleType: 1 | 2,
  ): Promise<unknown>;
}
