import { CloudFrontResponseHandler } from "aws-lambda";

export const handler: CloudFrontResponseHandler = async (event) => {
  // Extract the request and response from the event object
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;

  // Get the requested URI
  const requestedUri = request.uri;

  // S3 returns 403 rather than 404 for missing keys when the caller lacks s3:ListBucket
  if (response.status === "404" || response.status === "403") {
    const match = requestedUri.match(/^\/(\d+)\-(\w+)\/(.*)$/);

    // If they requested a specific width that does not exist, redirect to full width
    if (match) {
      const [, _width, format, rootKey] = match;
      return {
        status: "302",
        statusDescription: "Found",
        headers: {
          ...response.headers,
          location: [
            {
              key: "Location",
              value: `/${format}/${rootKey}`,
            },
          ],
        },
      };
    }
  }

  // Return the original response if no redirect is needed
  return response;
};
