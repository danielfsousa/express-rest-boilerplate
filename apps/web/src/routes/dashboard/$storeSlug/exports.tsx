import { Button } from '@astryxdesign/core/Button';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AppLayout } from '#/components/AppLayout.tsx';
import { ExportsPanel } from '#/features/exports/index.ts';
import { StoreSwitcher } from '#/features/stores/index.ts';

export const Route = createFileRoute('/dashboard/$storeSlug/exports')({
  component: ExportsDashboardPage,
});

function ExportsDashboardPage() {
  const { storeSlug } = Route.useParams();

  return (
    <AppLayout
      title={`Exports: ${storeSlug}`}
      headerActions={<StoreSwitcher activeSlug={storeSlug} />}
    >
      <Link to="/dashboard/$storeSlug" params={{ storeSlug }}>
        <Button label="Back to console" variant="ghost" size="sm" />
      </Link>
      <ExportsPanel storeSlug={storeSlug} />
    </AppLayout>
  );
}
