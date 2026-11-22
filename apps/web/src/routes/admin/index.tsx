import { Banner } from '@astryxdesign/core/Banner';
import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { AdminDashboard } from '#/features/admin/index.ts';
import { isAdminEnabled } from '#/lib/env.ts';

export const Route = createFileRoute('/admin/')({
  component: AdminRoutePage,
});

function AdminRoutePage() {
  if (!isAdminEnabled()) {
    return (
      <AppLayout title="SaaS Platform Admin">
        <Banner
          status="info"
          title="SaaS Admin module is disabled"
          description="Set VITE_FEATURE_ADMIN_ENABLED=true and FEATURE_ADMIN_ENABLED=true to enable platform administration."
        />
      </AppLayout>
    );
  }

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
