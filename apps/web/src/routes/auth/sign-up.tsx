import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { SignUpForm } from '#/features/auth/index.ts';

export const Route = createFileRoute('/auth/sign-up')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <AppLayout>
      <SignUpForm />
    </AppLayout>
  );
}
