import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod';
import { books, customers, orderItems, orders, storeExports } from './bookstore.ts';

export const bookSelectSchema = createSelectSchema(books);
export const bookInsertSchema = createInsertSchema(books);
export const bookUpdateSchema = createUpdateSchema(books);

export const customerSelectSchema = createSelectSchema(customers);
export const customerInsertSchema = createInsertSchema(customers);

export const orderSelectSchema = createSelectSchema(orders);
export const orderInsertSchema = createInsertSchema(orders);
export const orderUpdateSchema = createUpdateSchema(orders);

export const orderItemSelectSchema = createSelectSchema(orderItems);
export const orderItemInsertSchema = createInsertSchema(orderItems);

export const storeExportSelectSchema = createSelectSchema(storeExports);
export const storeExportInsertSchema = createInsertSchema(storeExports);
export const storeExportUpdateSchema = createUpdateSchema(storeExports);
