import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { AdminDashboard } from '#/features/admin/index.ts';

export const Route = createFileRoute('/admin/')({
  component: AdminRoutePage,
});

function AdminRoutePage() {
  return (
    <AppLayout title="SaaS Platform Admin">
      <AdminDashboard
        onImpersonated={() => {
          window.location.assign('/');
        }}
      />
    </AppLayout>
  );
}
