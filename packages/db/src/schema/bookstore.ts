import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { organization, user } from './auth.ts';

export const books = pgTable(
  'books',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: text('store_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    description: text('description').notNull().default(''),
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    stock: integer('stock').notNull().default(0),
    coverKey: text('cover_key'),
    published: boolean('published').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('books_store_sku_uidx').on(table.storeId, table.sku),
    check('books_price_non_negative', sql`${table.priceCents} >= 0`),
    check('books_stock_non_negative', sql`${table.stock} >= 0`),
  ],
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: text('store_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    locale: text('locale').notNull().default('en'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('customers_store_email_uidx').on(table.storeId, table.email)],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: text('store_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('pending_payment'),
    totalCents: integer('total_cents').notNull(),
    currency: text('currency').notNull().default('USD'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('orders_total_non_negative', sql`${table.totalCents} >= 0`)],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    storeId: text('store_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    bookId: uuid('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
  },
  (table) => [
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_unit_price_non_negative', sql`${table.unitPriceCents} >= 0`),
  ],
);

export const storeExports = pgTable('store_exports', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  storeId: text('store_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  requestedByUserId: text('requested_by_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('queued'),
  fileKey: text('file_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
