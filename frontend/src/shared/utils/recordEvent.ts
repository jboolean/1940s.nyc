/* eslint-disable @typescript-eslint/camelcase */
type AnalyticsEvent = {
  category: string;
  action: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
};
export default function recordEvent({
  category,
  action,
  label,
  value,
  nonInteraction,
}: AnalyticsEvent): void {
  const args = [
    action,
    {
      event_category: category,
      event_label: label,
      value: value,
      non_interaction: nonInteraction,
    },
  ] as const;
  if (!__DEV__) window.gtag('event', ...args);
  console.debug('recordEvent', ...args);
}
