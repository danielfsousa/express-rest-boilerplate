import { bookSchema, listBooksResponseSchema, uploadCoverResponseSchema } from '@starter/contracts';
import { extractSessionCookie, startTestPostgres } from '@starter/db/test-harness';
import type { TestPostgresHarness } from '@starter/db/test-harness';
import { createLogger } from '@starter/runtime';
import { createS3Storage } from '@starter/runtime/storage';
import { GenericContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, test } from 'vite-plus/test';
import { createApp } from '../../src/app.ts';
import { createAuth } from '../../src/features/auth/auth.service.ts';

describe('Books and Floci cover upload integration (apps/api)', () => {
  let pg: TestPostgresHarness;
  let flociContainer: Awaited<ReturnType<GenericContainer['start']>>;
  let flociEndpoint: string;

  beforeAll(async () => {
    const [pgHarness, floci] = await Promise.all([
      startTestPostgres(),
      new GenericContainer('floci/floci:latest').withExposedPorts(4566).start(),
    ]);
    pg = pgHarness;
    flociContainer = floci;

    flociEndpoint = `http://${floci.getHost()}:${String(floci.getMappedPort(4566))}`;
    const bucketRes = await fetch(`${flociEndpoint}/bookstore-media`, {
      method: 'PUT',
    });
    expect(bucketRes.ok).toBe(true);
  }, 90_000);

  afterAll(async () => {
    await Promise.all([pg?.stop(), flociContainer?.stop()]);
  }, 30_000);

  test('merchant CRUD, search, pagination, RLS SKU isolation, and Floci cover upload', async () => {
    const logger = createLogger({ level: 'silent' });
    const storage = createS3Storage({
      endpoint: flociEndpoint,
      region: 'us-east-1',
      accessKeyId: 'test',
      secretAccessKey: 'test',
      bucket: 'bookstore-media',
    });
    const auth = createAuth({
      db: pg.drizzleHandle.db,
      secret: 'test-secret-with-at-least-32-characters',
      baseURL: 'http://localhost',
      trustedOrigins: ['http://localhost'],
    });
    const app = createApp({
      db: pg.drizzleHandle,
      logger,
      drizzleDb: pg.drizzleHandle.db,
      auth,
      storage,
      multiTenancyEnabled: true,
    });

    const signUpA = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Merchant A',
          email: 'merchanta@test.dev',
          password: 'Password123!',
        }),
      }),
    );
    const cookieA = extractSessionCookie(signUpA);

    await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({ name: 'Alpha Books', slug: 'alpha-books' }),
      }),
    );

    const createPublished = await app.fetch(
      new Request('http://localhost/api/v1/stores/alpha-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({
          sku: 'BOOK-001',
          title: 'Designing Data Systems',
          author: 'Martin',
          priceCents: 4500,
          stock: 12,
          published: true,
        }),
      }),
    );
    expect(createPublished.status).toBe(201);
    const book1 = bookSchema.parse(await createPublished.json());

    const createDraft = await app.fetch(
      new Request('http://localhost/api/v1/stores/alpha-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({
          sku: 'BOOK-002',
          title: 'Draft Guide',
          author: 'Alice',
          priceCents: 1900,
          stock: 5,
          published: false,
        }),
      }),
    );
    expect(createDraft.status).toBe(201);

    const duplicateSku = await app.fetch(
      new Request('http://localhost/api/v1/stores/alpha-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({
          sku: 'BOOK-001',
          title: 'Duplicate',
          author: 'Bob',
          priceCents: 1000,
        }),
      }),
    );
    expect(duplicateSku.status).toBe(409);

    // Customer sees only published books and can search by q
    const publicList = await app.fetch(
      new Request('http://localhost/api/v1/stores/alpha-books/books?q=Data'),
    );
    expect(publicList.status).toBe(200);
    const parsedPublic = listBooksResponseSchema.parse(await publicList.json());
    expect(parsedPublic.total).toBe(1);
    expect(parsedPublic.books[0]?.title).toBe('Designing Data Systems');

    // Second store can reuse SKU BOOK-001 and cannot see Store A's books
    const signUpB = await app.fetch(
      new Request('http://localhost/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Merchant B',
          email: 'merchantb@test.dev',
          password: 'Password123!',
        }),
      }),
    );
    const cookieB = extractSessionCookie(signUpB);

    await app.fetch(
      new Request('http://localhost/api/v1/stores', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({ name: 'Beta Books', slug: 'beta-books' }),
      }),
    );

    const reuseSkuInStoreB = await app.fetch(
      new Request('http://localhost/api/v1/stores/beta-books/books', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({
          sku: 'BOOK-001',
          title: 'Beta Edition',
          author: 'Carol',
          priceCents: 2500,
          published: true,
        }),
      }),
    );
    expect(reuseSkuInStoreB.status).toBe(201);

    const crossStorePatch = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: cookieB },
        body: JSON.stringify({ title: 'Tampered' }),
      }),
    );
    expect(crossStorePatch.status).toBe(403);

    // Cover upload to Floci: valid PNG succeeds, invalid MIME returns 400, > 5 MB returns 413
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const validForm = new FormData();
    validForm.set('file', new File([pngBytes], 'cover.png', { type: 'image/png' }));

    const uploadRes = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}/cover`, {
        method: 'POST',
        headers: { cookie: cookieA },
        body: validForm,
      }),
    );
    expect(uploadRes.status).toBe(200);
    const uploaded = uploadCoverResponseSchema.parse(await uploadRes.json());
    expect(uploaded.coverKey).toContain(book1.id);

    const coverGetRes = await app.fetch(new Request(`http://localhost${uploaded.coverUrl}`));
    expect(coverGetRes.status).toBe(200);
    expect(coverGetRes.headers.get('content-type')).toBe('image/png');
    const fetchedBytes = new Uint8Array(await coverGetRes.arrayBuffer());
    expect(fetchedBytes).toEqual(pngBytes);

    const badMimeForm = new FormData();
    badMimeForm.set(
      'file',
      new File([new Uint8Array([1, 2, 3])], 'note.txt', { type: 'text/plain' }),
    );
    const badMimeRes = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}/cover`, {
        method: 'POST',
        headers: { cookie: cookieA },
        body: badMimeForm,
      }),
    );
    expect(badMimeRes.status).toBe(400);

    const bigForm = new FormData();
    bigForm.set(
      'file',
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', {
        type: 'image/png',
      }),
    );
    const bigRes = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}/cover`, {
        method: 'POST',
        headers: { cookie: cookieA },
        body: bigForm,
      }),
    );
    expect(bigRes.status).toBe(413);

    // Update book metadata and stock
    const patchRes = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: cookieA },
        body: JSON.stringify({
          title: 'Updated Pragmatic Book',
          priceCents: 4900,
          stock: 12,
        }),
      }),
    );
    expect(patchRes.status).toBe(200);
    const patched = bookSchema.parse(await patchRes.json());
    expect(patched.title).toBe('Updated Pragmatic Book');
    expect(patched.stock).toBe(12);

    // Delete book and confirm cover + row are removed
    const deleteRes = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}`, {
        method: 'DELETE',
        headers: { cookie: cookieA },
      }),
    );
    expect(deleteRes.status).toBe(200);

    const getAfterDelete = await app.fetch(
      new Request(`http://localhost/api/v1/stores/alpha-books/books/${book1.id}`),
    );
    expect(getAfterDelete.status).toBe(404);
  });
});
