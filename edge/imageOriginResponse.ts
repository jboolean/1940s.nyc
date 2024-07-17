import { CloudFrontResponseHandler } from "aws-lambda";

export const handler: CloudFrontResponseHandler = async (event) => {
  // Extract the request and response from the event object
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;

  // Get the requested URI
  const requestedUri = request.uri;

  if (response.status === "404") {
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
