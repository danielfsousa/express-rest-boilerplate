# Bookstore platform

A multi-tenant online bookstore platform where independent merchants operate storefronts, manage book catalogs and inventory, and sell books to customers.

## Language

**Store**:
An independent tenant storefront operated by one or more merchants on the platform, identified by a unique slug.
_Avoid_: Tenant, shop, workspace, organization

**Merchant**:
An authenticated user who owns or staffs a store and manages its catalog, inventory, orders, and billing plan.
_Avoid_: Admin, seller, operator

**Customer**:
A person who browses a store and places orders for books.
_Avoid_: Buyer, client, shopper, account

**Book**:
A catalog product sold by a store with a SKU, title, author, cover image, unit price, and available stock count.
_Avoid_: Product, item, title, listing

**Order**:
A customer's confirmed purchase of one or more books from a single store, moving through payment and fulfillment states.
_Avoid_: Purchase, transaction, cart, checkout

**Subscription**:
A store's recurring billing plan on the platform that controls plan limits and optional capabilities.
_Avoid_: Membership, tier, package
