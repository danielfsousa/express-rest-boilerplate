import type { Order, StoreBillingSummary, UpgradeStoreResponse } from '@starter/contracts';
import {
  and,
  books,
  customers,
  eq,
  orderItems,
  orders,
  organization,
  sql,
  subscription,
  withStoreContext,
} from '@starter/db';
import type { Database } from '@starter/db';
import type { Locale } from '@starter/i18n';
import { JOB_NAMES } from '@starter/jobs';
import type { JobQueue } from '@starter/jobs';
import Stripe from 'stripe';

export const FREE_PLAN_PUBLISHED_BOOK_LIMIT = 25;

export interface CreateStripeClientOptions {
  secretKey: string;
  host?: string | undefined;
  port?: number | undefined;
  protocol?: 'http' | 'https' | undefined;
}

export function createStripeClient(options: CreateStripeClientOptions): Stripe {
  if (options.host) {
    return new Stripe(options.secretKey, {
      host: options.host,
      port: options.port ?? 443,
      protocol: options.protocol ?? 'https',
    });
  }
  return new Stripe(options.secretKey);
}

async function findActiveSubscription(db: Database, storeId: string) {
  const [sub] = await db
    .select()
    .from(subscription)
    .where(eq(subscription.referenceId, storeId))
    .limit(1);
  return sub ?? null;
}

function resolvePlan(sub: typeof subscription.$inferSelect | null) {
  if (sub && sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing')) {
    return { plan: 'pro' as const, status: sub.status };
  }
  return { plan: 'free' as const, status: sub?.status ?? 'active' };
}

export async function getStoreBillingSummary(
  db: Database,
  storeId: string,
): Promise<StoreBillingSummary> {
  const sub = await findActiveSubscription(db, storeId);
  const { plan, status } = resolvePlan(sub);

  const [countRow] = await withStoreContext(db, storeId, async (tx) =>
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(and(eq(books.storeId, storeId), eq(books.published, true))),
  );

  return {
    plan,
    status,
    publishedBookCount: countRow?.count ?? 0,
    bookLimit: plan === 'free' ? FREE_PLAN_PUBLISHED_BOOK_LIMIT : null,
    stripeCustomerId: sub?.stripeCustomerId ?? null,
    stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
  };
}

export async function assertCanPublishBook(
  db: Database,
  storeId: string,
  billingEnabled: boolean,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  if (!billingEnabled) {
    return { allowed: true };
  }

  const summary = await getStoreBillingSummary(db, storeId);
  if (summary.bookLimit !== null && summary.publishedBookCount >= summary.bookLimit) {
    return {
      allowed: false,
      error: `Free plan allows up to ${String(summary.bookLimit)} published books. Upgrade to Pro for unlimited books.`,
    };
  }

  return { allowed: true };
}

export async function upgradeStoreSubscription(params: {
  db: Database;
  stripe: Stripe;
  storeId: string;
  storeName: string;
  proPriceId: string;
  webOrigin: string;
  storeSlug: string;
}): Promise<UpgradeStoreResponse> {
  const customer = await params.stripe.customers.create({
    name: params.storeName,
    metadata: { storeId: params.storeId },
  });

  const existing = await findActiveSubscription(params.db, params.storeId);
  const subId = existing?.id ?? crypto.randomUUID();
  const stripeSub = await params.stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: params.proPriceId }],
  });

  if (existing) {
    await params.db
      .update(subscription)
      .set({
        plan: 'pro',
        status: 'active',
        stripeCustomerId: customer.id,
        stripeSubscriptionId: stripeSub.id,
      })
      .where(eq(subscription.id, existing.id));
  } else {
    await params.db.insert(subscription).values({
      id: subId,
      plan: 'pro',
      referenceId: params.storeId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: stripeSub.id,
      status: 'active',
    });
  }

  return {
    plan: 'pro',
    status: 'active',
    checkoutUrl: `${params.webOrigin}/dashboard/${params.storeSlug}/billing?upgraded=1`,
  };
}

export async function createOrderCheckoutSession(params: {
  stripe: Stripe;
  storeSlug: string;
  order: Order;
  webOrigin: string;
}): Promise<{ sessionId: string; url: string | null }> {
  const lineItems = await Promise.all(
    params.order.items.map(async (item) => {
      const product = await params.stripe.products.create({
        name: item.title,
      });
      const price = await params.stripe.prices.create({
        product: product.id,
        unit_amount: item.unitPriceCents,
        currency: params.order.currency.toLowerCase(),
      });
      return {
        price: price.id,
        quantity: item.quantity,
      };
    }),
  );

  const session = await params.stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${params.webOrigin}/s/${params.storeSlug}/orders/${params.order.id}?paid=1`,
    cancel_url: `${params.webOrigin}/s/${params.storeSlug}/orders/${params.order.id}?cancelled=1`,
    metadata: {
      storeId: params.order.storeId,
      orderId: params.order.id,
    },
    line_items: lineItems,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export type WebhookResult =
  | { ok: true; eventType: string }
  | { ok: false; status: 400; error: string };

export async function verifyAndProcessStripeWebhook(params: {
  stripe: Stripe;
  webhookSecret: string;
  rawBody: string;
  signature: string | undefined;
  db: Database;
  jobQueue?: JobQueue | undefined;
}): Promise<WebhookResult> {
  if (!params.signature) {
    return { ok: false, status: 400, error: 'Missing stripe-signature header' };
  }

  let event: Stripe.Event;
  try {
    event = params.stripe.webhooks.constructEvent(
      params.rawBody,
      params.signature,
      params.webhookSecret,
    );
  } catch {
    return { ok: false, status: 400, error: 'Invalid Stripe webhook signature' };
  }

  if (event.type === 'checkout.session.completed') {
    const sessionObj = event.data.object;
    const storeId = sessionObj.metadata?.['storeId'];
    const orderId = sessionObj.metadata?.['orderId'];

    if (storeId && orderId) {
      await withStoreContext(params.db, storeId, async (tx) =>
        tx
          .update(orders)
          .set({ status: 'paid', updatedAt: new Date() })
          .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId))),
      );

      if (params.jobQueue) {
        const [storeRow] = await params.db
          .select({ name: organization.name })
          .from(organization)
          .where(eq(organization.id, storeId))
          .limit(1);

        const orderDetails = await withStoreContext(params.db, storeId, async (tx) => {
          const [orderRow] = await tx
            .select({
              id: orders.id,
              totalCents: orders.totalCents,
              currency: orders.currency,
              customerEmail: customers.email,
              customerName: customers.name,
              customerLocale: customers.locale,
            })
            .from(orders)
            .innerJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.storeId, storeId)))
            .limit(1);

          if (!orderRow) {
            return null;
          }

          const items = await tx
            .select({
              title: books.title,
              quantity: orderItems.quantity,
              unitPriceCents: orderItems.unitPriceCents,
            })
            .from(orderItems)
            .innerJoin(books, eq(orderItems.bookId, books.id))
            .where(and(eq(orderItems.orderId, orderId), eq(orderItems.storeId, storeId)));

          return { orderRow, items };
        });

        if (orderDetails) {
          const locale: Locale = orderDetails.orderRow.customerLocale === 'pt-BR' ? 'pt-BR' : 'en';
          await params.jobQueue.enqueue({
            name: JOB_NAMES.ORDER_RECEIPT,
            payload: {
              storeId,
              storeName: storeRow?.name ?? storeId,
              orderId: orderDetails.orderRow.id,
              customerEmail: orderDetails.orderRow.customerEmail,
              customerName: orderDetails.orderRow.customerName,
              locale,
              totalCents: orderDetails.orderRow.totalCents,
              currency: orderDetails.orderRow.currency,
              items: orderDetails.items,
            },
          });
        }
      }
    }
  }

  return { ok: true, eventType: event.type };
}
