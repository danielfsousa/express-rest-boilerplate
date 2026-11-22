import { defineRelations } from 'drizzle-orm';
import {
  account,
  books,
  customers,
  invitation,
  member,
  orderItems,
  orders,
  organization,
  session,
  storeExports,
  subscription,
  user,
  verification,
} from './schema/index.ts';

const schema = {
  account,
  books,
  customers,
  invitation,
  member,
  orderItems,
  orders,
  organization,
  session,
  storeExports,
  subscription,
  user,
  verification,
};

export const relations = defineRelations(schema, (r) => ({
  organization: {
    members: r.many.member({
      from: r.organization.id,
      to: r.member.organizationId,
    }),
    books: r.many.books({
      from: r.organization.id,
      to: r.books.storeId,
    }),
    customers: r.many.customers({
      from: r.organization.id,
      to: r.customers.storeId,
    }),
    orders: r.many.orders({
      from: r.organization.id,
      to: r.orders.storeId,
    }),
    exports: r.many.storeExports({
      from: r.organization.id,
      to: r.storeExports.storeId,
    }),
  },
  member: {
    store: r.one.organization({
      from: r.member.organizationId,
      to: r.organization.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.member.userId,
      to: r.user.id,
      optional: false,
    }),
  },
  books: {
    store: r.one.organization({
      from: r.books.storeId,
      to: r.organization.id,
      optional: false,
    }),
    orderItems: r.many.orderItems({
      from: r.books.id,
      to: r.orderItems.bookId,
    }),
  },
  customers: {
    store: r.one.organization({
      from: r.customers.storeId,
      to: r.organization.id,
      optional: false,
    }),
    orders: r.many.orders({
      from: r.customers.id,
      to: r.orders.customerId,
    }),
  },
  orders: {
    store: r.one.organization({
      from: r.orders.storeId,
      to: r.organization.id,
      optional: false,
    }),
    customer: r.one.customers({
      from: r.orders.customerId,
      to: r.customers.id,
      optional: false,
    }),
    items: r.many.orderItems({
      from: r.orders.id,
      to: r.orderItems.orderId,
    }),
  },
  orderItems: {
    order: r.one.orders({
      from: r.orderItems.orderId,
      to: r.orders.id,
      optional: false,
    }),
    book: r.one.books({
      from: r.orderItems.bookId,
      to: r.books.id,
      optional: false,
    }),
  },
  storeExports: {
    store: r.one.organization({
      from: r.storeExports.storeId,
      to: r.organization.id,
      optional: false,
    }),
  },
}));
