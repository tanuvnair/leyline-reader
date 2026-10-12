/** Linked Genshin account metadata stored in the vault (no secrets). */
export interface LinkedAccountMeta {
  uid: number;
  nickname: string;
  level: number;
  region: string;
  linkedAt: string;
}

/** Encrypted-at-rest cookie payload shape (secret stays in Infrastructure). */
export interface HoyoCookiePayload {
  cookie: string;
  capturedAt: string;
}
