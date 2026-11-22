import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../../components/AppLayout.tsx';
import { SignInForm } from '../../features/auth/index.ts';

export const Route = createFileRoute('/auth/sign-in')({
  component: SignInPage,
});

function SignInPage() {
  return (
    <AppLayout>
      <SignInForm />
    </AppLayout>
  );
}
