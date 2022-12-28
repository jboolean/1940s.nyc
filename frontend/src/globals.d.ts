declare let __DEV__: boolean;
declare let __LOCALE__: string;
declare let __API_BASE__: string;

interface Window {
  dataLayer?: Record<string, unknown>[];
}
