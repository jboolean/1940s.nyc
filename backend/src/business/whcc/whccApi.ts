import { isAxiosError } from 'axios';
import { client } from '../../third-party/whcc/client/client.gen';
import {
  getV1CommerceSubmissions,
  getV1CommerceSubmissionsSubmissionid,
  postV1CommerceConfiguredproducts,
  postV1CommerceSubmissions,
  postV1CommerceSubmissionsCalculate,
} from '../../third-party/whcc/client/sdk.gen';
import type {
  GetV1CommerceConfiguredproductsResponses,
  GetV1CommerceSubmissionsData,
  Model38,
  PostV1CommerceConfiguredproductsData,
  PostV1CommerceSubmissionsCalculateData,
  PostV1CommerceSubmissionsData,
} from '../../third-party/whcc/client/types.gen';
import {
  getAuthorizationHeader,
  WHCC_BASE_URL,
} from '../../third-party/whcc/createClientConfig';
import { client as fulfillmentClient } from '../../third-party/whcc/fulfillmentClient/client.gen';
import {
  createEventSubscription as createEventSubscriptionRequest,
  enableEventSubscription as enableEventSubscriptionRequest,
  listEventSubscriptions as listEventSubscriptionsRequest,
  mintOrderCancelActions,
  requestOrderCancellation,
} from '../../third-party/whcc/fulfillmentClient/sdk.gen';
import type {
  CreateEventSubscriptionData,
  ListOrdersResponses,
} from '../../third-party/whcc/fulfillmentClient/types.gen';
import isProduction from '../utils/isProduction';

const REQUEST_TIMEOUT_MS = 4_000;

// Refuses production and adds the key to every request.
function authorize<
  T extends { headers: { set: (k: string, v: string) => unknown } },
>(config: T): T {
  if (isProduction()) {
    throw new Error('The WHCC production base URL is not configured');
  }
  config.headers.set('Authorization', getAuthorizationHeader());
  return config;
}
client.instance.interceptors.request.use(authorize);
fulfillmentClient.instance.interceptors.request.use(authorize);

// The generated types require this header. The interceptor sets the real one.
const AUTHORIZED = { authorization: '' };

// Turns an action link into a path and query for the client. Throws unless the link is on our host
// and under `apiPrefix` (no "//", which can read as another host). `basePath` is the part of the
// prefix the client's base URL already has.
export function linkPath(
  link: string,
  apiPrefix: string,
  basePath: string
): string {
  const url = new URL(link);
  if (url.origin !== new URL(WHCC_BASE_URL).origin) {
    throw new Error(`WHCC action link points at another host: ${url.origin}`);
  }
  if (!url.pathname.startsWith(apiPrefix) || url.pathname.includes('//')) {
    throw new Error(`WHCC action link has an unexpected path: ${url.pathname}`);
  }
  return url.pathname.slice(basePath.length) + url.search;
}

const COMMERCE_LINKS = ['/api/v1/', '/api'] as const;
const FULFILLMENT_LINKS = ['/api/v1/fulfillment/', ''] as const;

export type ConfiguredProductRequest = NonNullable<
  PostV1CommerceConfiguredproductsData['body']
>['configuredProducts'][number];
export type SubmissionRequest = NonNullable<
  PostV1CommerceSubmissionsData['body']
>;
export type ShippingAddress = SubmissionRequest['shipping']['address'];
export type CalculateRequest = NonNullable<
  PostV1CommerceSubmissionsCalculateData['body']
>;
export type CreateEventSubscriptionRequest = NonNullable<
  CreateEventSubscriptionData['body']
>;
export type ConfiguredProduct =
  GetV1CommerceConfiguredproductsResponses[200]['items'][number];

export interface ConfiguredProducts {
  items: ConfiguredProduct[];
  pollUrl?: string;
}

// The spec types these responses as strings, so the documented shapes are declared here.
export interface Submission {
  id: string;
  status: NonNullable<
    NonNullable<GetV1CommerceSubmissionsData['query']>['status']
  >;
  orders?: (Omit<Model38, 'status'> & {
    status: string;
    actions?: { fulfillment?: { url?: string } };
  })[];
}

export interface Calculation {
  validation: { isValidForSubmit: boolean };
  options?: {
    shipping?: {
      priority: string;
      label: string;
      price: { value: string; code: string };
    }[];
  };
}

// A 401, or a 403 with a { message } body, comes from the gateway (bad key). Any other body is
// Problem Details.
export class WhccApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem?: {
      code?: string;
      title?: string;
      invalidParams?: unknown;
    },
    readonly gatewayMessage?: string
  ) {
    super(
      `WHCC request failed with ${status}: ${
        problem?.code ?? problem?.title ?? gatewayMessage ?? 'no detail'
      }${problem?.invalidParams ? ` ${JSON.stringify(problem.invalidParams)}` : ''}`
    );
  }
}

// `deadline` is epoch milliseconds for the caller's whole operation.
async function call<T extends { data: unknown }>(
  deadline: number | undefined,
  send: (options: { throwOnError: true; timeout: number }) => Promise<T>
): Promise<T['data']> {
  const remaining = deadline === undefined ? Infinity : deadline - Date.now();
  if (remaining <= 0) {
    throw new Error('The time budget ran out before calling WHCC');
  }
  try {
    const { data } = await send({
      throwOnError: true,
      timeout: Math.min(REQUEST_TIMEOUT_MS, remaining),
    });
    return data;
  } catch (e) {
    // Axios errors include the Authorization header, so they are not rethrown.
    if (isAxiosError(e) && !e.response) {
      throw new WhccApiError(0, { title: e.code ?? 'no response' });
    }
    if (isAxiosError(e) && e.response) {
      const body = e.response.data as
        { message?: string; title?: string; code?: string } | undefined;
      throw body?.title === undefined && typeof body?.message === 'string'
        ? new WhccApiError(e.response.status, undefined, body.message)
        : new WhccApiError(e.response.status, body);
    }
    throw e;
  }
}

function toConfiguredProducts(data: {
  items?: Partial<ConfiguredProduct>[];
  actions?: { poll?: { url?: string } };
}): ConfiguredProducts {
  return {
    items: (data.items ?? []).map((i) => ({
      ...i,
      configuredProductId: i.configuredProductId as string,
      status: i.status as ConfiguredProduct['status'],
    })),
    pollUrl: data.actions?.poll?.url,
  };
}

// Not retried: every call builds new configured products.
export async function createConfiguredProducts(
  configuredProducts: ConfiguredProductRequest[],
  deadline?: number
): Promise<ConfiguredProducts> {
  return toConfiguredProducts(
    await call(deadline, (o) =>
      postV1CommerceConfiguredproducts({
        ...o,
        headers: AUTHORIZED,
        body: { configuredProducts },
      })
    )
  );
}

// Follows the create response's actions.poll link.
export async function pollConfiguredProducts(
  pollUrl: string,
  deadline?: number
): Promise<ConfiguredProducts> {
  return toConfiguredProducts(
    await call(deadline, (o) =>
      client.get<GetV1CommerceConfiguredproductsResponses, unknown, true>({
        ...o,
        url: linkPath(pollUrl, ...COMMERCE_LINKS),
      })
    )
  );
}

// Unlike submit, calculate takes no idempotency key.
export async function calculate(
  body: CalculateRequest,
  deadline?: number
): Promise<Calculation> {
  return (await call(deadline, (o) =>
    postV1CommerceSubmissionsCalculate({ ...o, headers: AUTHORIZED, body })
  )) as unknown as Calculation;
}

// The same key and body return the original submission. The same key with another body is a 409.
export async function submit(
  body: SubmissionRequest,
  idempotencyKey: string,
  deadline?: number
): Promise<Submission> {
  return (await call(deadline, (o) =>
    postV1CommerceSubmissions({
      ...o,
      headers: { ...AUTHORIZED, 'idempotency-key': idempotencyKey },
      body,
    })
  )) as Submission;
}

export async function getSubmission(
  submissionId: string,
  deadline?: number
): Promise<Submission> {
  return (await call(deadline, (o) =>
    getV1CommerceSubmissionsSubmissionid({
      ...o,
      headers: AUTHORIZED,
      path: { submissionId },
    })
  )) as unknown as Submission;
}

// Filters match exactly. No match gives an empty page, not a 404.
export async function listSubmissions(
  filter: { reference: string } | { confirmationId: string },
  deadline?: number
): Promise<{
  submissions: (Pick<Submission, 'id'> & { reference?: string })[];
}> {
  return (await call(deadline, (o) =>
    getV1CommerceSubmissions({ ...o, headers: AUTHORIZED, query: filter })
  )) as unknown as {
    submissions: (Pick<Submission, 'id'> & { reference?: string })[];
  };
}

// Follows actions.fulfillment on a submission or order.
export function listFulfillmentOrders(
  fulfillmentUrl: string
): Promise<ListOrdersResponses[200]> {
  return call(undefined, (o) =>
    fulfillmentClient.get<ListOrdersResponses, unknown, true>({
      ...o,
      url: linkPath(fulfillmentUrl, ...FULFILLMENT_LINKS),
    })
  );
}

// Cancel is irreversible and takes two calls. The first returns the token for the second.
export async function cancelFulfillmentOrder(id: string): Promise<void> {
  const { token } = await call(undefined, (o) =>
    mintOrderCancelActions({ ...o, path: { id } })
  );
  await call(undefined, (o) =>
    requestOrderCancellation({
      ...o,
      path: { id },
      body: { cancelToken: token },
    })
  );
}

export function listEventSubscriptions(): ReturnType<
  typeof call<Awaited<ReturnType<typeof listEventSubscriptionsRequest<true>>>>
> {
  return call(undefined, (o) => listEventSubscriptionsRequest(o));
}

export function createEventSubscription(
  body: CreateEventSubscriptionRequest,
  idempotencyKey: string
): ReturnType<
  typeof call<Awaited<ReturnType<typeof createEventSubscriptionRequest<true>>>>
> {
  return call(undefined, (o) =>
    createEventSubscriptionRequest({
      ...o,
      headers: { 'idempotency-key': idempotencyKey },
      body,
    })
  );
}

export async function enableEventSubscription(id: string): Promise<void> {
  await call(undefined, (o) =>
    enableEventSubscriptionRequest({ ...o, path: { id } })
  );
}
