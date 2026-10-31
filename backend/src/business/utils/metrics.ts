// CloudWatch turns a log line shaped like this into a metric, so something that
// only shows up in the logs can be watched, counted and alerted on.
export function logCountMetric(
  namespace: string,
  name: string,
  dimensions: Record<string, string>
): void {
  console.log(
    JSON.stringify({
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: namespace,
            Dimensions: [Object.keys(dimensions)],
            Metrics: [{ Name: name, Unit: 'Count' }],
          },
        ],
      },
      ...dimensions,
      [name]: 1,
    })
  );
}
