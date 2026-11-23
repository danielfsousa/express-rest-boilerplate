// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vite-plus/test';
import { z } from 'zod';
import { renderWithAppProviders } from '#/test/render.tsx';
import { SignInForm } from './SignInForm.tsx';
import { SignUpForm } from './SignUpForm.tsx';

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe('Auth forms', () => {
  test('SignInForm submits credentials and navigates home on success', async () => {
    let submittedEmail = '';
    server.use(
      http.post('http://127.0.0.1:3001/api/auth/sign-in/email', async ({ request }) => {
        const body = z
          .object({ email: z.string(), password: z.string() })
          .parse(await request.json());
        submittedEmail = body.email;
        return HttpResponse.json({
          user: { id: 'u1', email: body.email, name: 'Ada' },
          session: { id: 's1', userId: 'u1' },
        });
      }),
    );

    const { router } = await renderWithAppProviders(<SignInForm />, {
      initialPath: '/auth/sign-in',
    });

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(submittedEmail).toBe('ada@example.com');
      expect(router.state.location.pathname).toBe('/');
    });
  });

  test('SignInForm displays error banner when authentication fails', async () => {
    server.use(
      http.post('http://127.0.0.1:3001/api/auth/sign-in/email', () =>
        HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 }),
      ),
    );

    await renderWithAppProviders(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeTruthy();
  });

  test('SignUpForm creates account and navigates home, and surfaces errors', async () => {
    let createdName = '';
    server.use(
      http.post('http://127.0.0.1:3001/api/auth/sign-up/email', async ({ request }) => {
        const body = z
          .object({ name: z.string(), email: z.string(), password: z.string() })
          .parse(await request.json());
        createdName = body.name;
        return HttpResponse.json({
          user: { id: 'u2', email: body.email, name: body.name },
          session: { id: 's2', userId: 'u2' },
        });
      }),
    );

    const { router } = await renderWithAppProviders(<SignUpForm />, {
      initialPath: '/auth/sign-up',
    });

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Grace Hopper' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(createdName).toBe('Grace Hopper');
      expect(router.state.location.pathname).toBe('/');
    });

    server.use(
      http.post('http://127.0.0.1:3001/api/auth/sign-up/email', () =>
        HttpResponse.json({ message: 'Email already registered' }, { status: 400 }),
      ),
    );

    await renderWithAppProviders(<SignUpForm />);
    const nameInputs = screen.getAllByLabelText(/Full name/i);
    const emailInputs = screen.getAllByLabelText(/Email/i);
    const passwordInputs = screen.getAllByLabelText(/Password/i);
    const submitButtons = screen.getAllByRole('button', { name: 'Create account' });

    fireEvent.change(nameInputs.at(-1)!, { target: { value: 'Grace' } });
    fireEvent.change(emailInputs.at(-1)!, {
      target: { value: 'grace@example.com' },
    });
    fireEvent.change(passwordInputs.at(-1)!, {
      target: { value: 'password123' },
    });
    fireEvent.click(submitButtons.at(-1)!);

    expect(await screen.findByText('Email already registered')).toBeTruthy();
  });
});
