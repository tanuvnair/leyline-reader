import {z} from 'zod';

const windowSizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  minWidth: z.number().int().positive().optional(),
  minHeight: z.number().int().positive().optional(),
});

export const appConfigSchema = z.object({
  appName: z.string().min(1),
  productName: z.string().min(1),
  userDataDirName: z.string().min(1),
  storage: z.object({
    storeFileName: z.string().min(1),
    userDataDirOverride: z.string().nullable(),
  }),
  hoyo: z.object({
    loginUrl: z.string().url(),
    bbsApiBase: z.string().url(),
    characterListPath: z
      .string()
      .regex(/^\/[A-Za-z0-9/_-]+$/),
    realTimeNotesUrl: z.string().url(),
    cookieDomains: z.array(z.string().min(1)).min(1),
    cookieKeys: z.array(z.string().min(1)).min(1),
    sessionPartition: z.string().min(1),
    successUrlPatterns: z.array(z.string().min(1)).min(1),
    language: z.string().min(1),
  }),
  genshinDev: z.object({
    baseUrl: z.string().url(),
    timeoutMs: z.number().int().positive(),
    cacheTtlMs: z.number().int().nonnegative(),
  }),
  auth: z.object({
    bcryptRounds: z.number().int().min(10).max(20),
    sessionIdleTimeoutMs: z.number().int().positive(),
    maxFailedAttempts: z.number().int().min(3).max(20),
    lockoutMs: z.number().int().positive(),
    passwordPolicy: z.object({
      minLength: z.number().int().min(8).max(128),
      requireLetter: z.boolean(),
      requireNumber: z.boolean(),
      requireSpecial: z.boolean(),
    }),
  }),
  window: z.object({
    main: windowSizeSchema,
    login: windowSizeSchema,
    frame: z.boolean(),
    customTitleBar: z.boolean(),
    titleBarHeight: z.number().int().positive(),
    devTools: z.boolean(),
  }),
  security: z.object({
    allowedExternalHosts: z.array(z.string().min(1)).min(1),
  }),
  features: z.object({
    overview: z.boolean(),
    characters: z.boolean(),
    abyss: z.boolean(),
    settings: z.boolean(),
  }),
  i18n: z.object({
    defaultLanguage: z.string().min(1),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

/** Non-secret subset safe to expose to the renderer. */
export type PublicAppConfig = Pick<
  AppConfig,
  'appName' | 'productName' | 'features' | 'i18n' | 'genshinDev'
> & {
  window: Pick<
    AppConfig['window'],
    'customTitleBar' | 'titleBarHeight'
  >;
  auth: {
    passwordPolicy: AppConfig['auth']['passwordPolicy'];
  };
  hoyo: {
    realTimeNotesUrl: AppConfig['hoyo']['realTimeNotesUrl'];
  };
};
