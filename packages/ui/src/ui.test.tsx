// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import {
  Banner,
  Button,
  DataRow,
  EmptyNotice,
  Heading,
  PageShell,
  resolveStarterTokens,
  SectionCard,
  starterDarkTokens,
  starterLightTokens,
  StarterThemeProvider,
  StatusPill,
  Text,
} from './index.ts';

afterEach(() => {
  cleanup();
});

describe('@starter/ui', () => {
  test('resolves concrete light and dark tokens from Astryx Stone theme', () => {
    const light = resolveStarterTokens('light');
    const dark = resolveStarterTokens('dark');

    expect(light).toEqual(starterLightTokens);
    expect(dark).toEqual(starterDarkTokens);

    expect(light.colors.canvas).toBe('#FAFAFA');
    expect(light.colors.surface).toBe('#FFFFFF');
    expect(light.colors.ink).toBe('#171717');
    expect(light.colors.accent).toBe('#171717');
    expect(light.colors.onAccent).toBe('#FFFFFF');
    expect(light.colors.border).toBe('#EBEBEB');
    expect(light.colors.success).toBe('#297A3A');

    expect(dark.colors.canvas).toBe('#111110');
    expect(dark.colors.surface).toBe('#191918');
    expect(dark.colors.ink).toBe('#F5F5F4');

    for (const value of Object.values(light.colors)) {
      expect(value).not.toContain('var(');
      expect(value).not.toContain('light-dark(');
    }
    expect(light.typography.bodyFamily).toContain('Figtree');
    expect(light.radii.container.length).toBeGreaterThan(0);
  });

  test('renders StarterThemeProvider and kit components in full and minimal variants', () => {
    render(
      <StarterThemeProvider mode="light">
        <PageShell
          banner={<Banner status="info" title="System notice" />}
          title="Merchant Console"
          subtitle="Manage storefront catalog"
          actions={<Button label="New Book" variant="primary" size="sm" />}
        >
          <SectionCard
            title="Catalog"
            description="Active inventory"
            headerActions={<Button label="Export" variant="secondary" size="sm" />}
          >
            <DataRow
              title="Designing Data-Intensive Applications"
              subtitle="Martin Kleppmann · $39.00"
              status={<StatusPill tone="success" label="Published" />}
              actions={<Button label="Edit" variant="secondary" size="sm" />}
            />
            <DataRow title="Minimal row" />
          </SectionCard>
          <SectionCard>
            <Text>Headerless section card</Text>
          </SectionCard>
          <StatusPill tone="neutral" label="Neutral" />
          <StatusPill tone="info" label="Info" isPulsing />
          <StatusPill tone="warning" label="Warning" />
          <StatusPill tone="error" label="Error" />
          <EmptyNotice
            title="No archived books"
            description="Archived titles appear here."
            actions={<Button label="Refresh" variant="ghost" size="sm" />}
          />
          <EmptyNotice title="Compact empty" isCompact />
        </PageShell>
        <PageShell title={<Heading level={1}>Custom ReactNode Title</Heading>}>
          <Text>Second shell</Text>
        </PageShell>
        <PageShell>
          <Text>Headerless shell</Text>
        </PageShell>
      </StarterThemeProvider>,
    );

    expect(screen.getByText('System notice')).toBeTruthy();
    expect(screen.getByText('Merchant Console')).toBeTruthy();
    expect(screen.getByText('Manage storefront catalog')).toBeTruthy();
    expect(screen.getByText('Catalog')).toBeTruthy();
    expect(screen.getByText('Headerless section card')).toBeTruthy();
    expect(screen.getByText('Minimal row')).toBeTruthy();
    expect(screen.getByText('Designing Data-Intensive Applications')).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();
    expect(screen.getByText('Neutral')).toBeTruthy();
    expect(screen.getByText('Info')).toBeTruthy();
    expect(screen.getByText('Warning')).toBeTruthy();
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('No archived books')).toBeTruthy();
    expect(screen.getByText('Compact empty')).toBeTruthy();
    expect(screen.getByText('Custom ReactNode Title')).toBeTruthy();
    expect(screen.getByText('Headerless shell')).toBeTruthy();
  });
});
