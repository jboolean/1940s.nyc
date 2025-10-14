declare let __DEV__: boolean;
declare let __LOCALE__: string;
declare let __API_BASE__: string;
declare let __STRIPE_PK__: string;
declare let __RECAPTCHA_PK__: string;

interface Window {
  dataLayer?: Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  netlifyIdentity: any;
}
