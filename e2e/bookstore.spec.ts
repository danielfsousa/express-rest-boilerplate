import { expect, test } from '@playwright/test';
import { readEnv } from '@starter/runtime';

const env = readEnv();
const apiBaseUrl = env['E2E_API_URL'] ?? 'http://127.0.0.1:3001';
const birdBaseUrl = env['E2E_BIRD_URL'] ?? 'http://127.0.0.1:4010';

test.describe('Multi-tenant bookstore platform E2E', () => {
  test('merchant and customer end-to-end journey', async ({ browser }) => {
    const suffix = String(Date.now());
    const merchantEmail = `merchant-${suffix}@example.com`;
    const storeSlug = `e2e-store-${suffix}`;

    const merchantContext = await browser.newContext();
    const customerContext = await browser.newContext();
    const merchantPage = await merchantContext.newPage();
    const customerPage = await customerContext.newPage();

    try {
      // 1. Merchant sign-up
      await merchantPage.goto('/sign-up');
      await merchantPage.getByLabel('Full name').fill('Ada E2E');
      await merchantPage.getByLabel('Email').fill(merchantEmail);
      await merchantPage.getByLabel('Password').fill('Password123!');
      await merchantPage.getByRole('button', { name: 'Create account' }).click();
      await merchantPage.waitForURL('/');

      // 2. Store creation
      await merchantPage.getByLabel('Store name').fill('E2E Bookstore');
      await merchantPage.getByLabel('Store slug').fill(storeSlug);
      await merchantPage.getByRole('button', { name: 'Create store' }).click();
      await merchantPage.waitForURL(`/dashboard/${storeSlug}`);

      // 3. Book creation
      await merchantPage.getByRole('button', { name: 'Manage Books' }).click();
      await merchantPage.waitForURL(`/dashboard/${storeSlug}/books`);
      await merchantPage.getByLabel('SKU').fill(`E2E-${suffix}`);
      await merchantPage.getByLabel('Title').fill('Designing E2E Systems');
      await merchantPage.getByLabel('Author').fill('Ada Lovelace');
      await merchantPage.getByLabel('Price (USD)').fill('29.99');
      await merchantPage.getByLabel('Stock').fill('10');
      await merchantPage.getByRole('button', { name: 'Add book' }).click();
      await expect(merchantPage.getByText('Designing E2E Systems')).toBeVisible();

      // 4. Customer browses storefront in en and switches to pt-BR
      await customerPage.goto(`/s/${storeSlug}`);
      await expect(customerPage.getByText('Designing E2E Systems')).toBeVisible();
      await customerPage.getByRole('button', { name: 'PT-BR' }).click();
      await customerPage.getByRole('button', { name: 'EN' }).click();

      // 5. Customer views book and places order
      await customerPage.getByRole('button', { name: 'View book' }).first().click();
      await customerPage.getByLabel('Your name').fill('Customer One');
      await customerPage.getByLabel('Email address').fill(`customer-${suffix}@example.com`);
      await customerPage.getByLabel('Quantity').fill('1');
      await customerPage.getByRole('button', { name: 'Place order' }).click();

      // 6. Verify customer order tracker or checkout link
      await expect(customerPage.getByText(/Order|Complete your payment/i).first()).toBeVisible();

      // 7. Merchant exports catalog CSV
      await merchantPage.goto(`/dashboard/${storeSlug}/exports`);
      await merchantPage.getByRole('button', { name: 'Export books CSV' }).click();
      await expect(merchantPage.getByText(/completed|queued/i).first()).toBeVisible();

      // 8. Verify API health and Bird emulator reachable
      const healthRes = await merchantPage.request.get(`${apiBaseUrl}/health/ready`);
      expect(healthRes.status()).toBe(200);
      const birdRes = await merchantPage.request.get(`${birdBaseUrl}/__messages`);
      expect(birdRes.status()).toBe(200);
    } finally {
      await Promise.all([merchantContext.close(), customerContext.close()]);
    }
  });
});
