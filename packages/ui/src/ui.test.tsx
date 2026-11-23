// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import {
  Button,
  DataRow,
  EmptyNotice,
  PageShell,
  resolveStarterTokens,
  SectionCard,
  starterDarkTokens,
  starterLightTokens,
  StarterThemeProvider,
  StatusPill,
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

  test('renders StarterThemeProvider and kit components', () => {
    render(
      <StarterThemeProvider mode="light">
        <PageShell
          title="Merchant Console"
          subtitle="Manage storefront catalog"
          actions={<Button label="New Book" variant="primary" size="sm" />}
        >
          <SectionCard title="Catalog" description="Active inventory">
            <DataRow
              title="Designing Data-Intensive Applications"
              subtitle="Martin Kleppmann · $39.00"
              status={<StatusPill tone="success" label="Published" />}
              actions={<Button label="Edit" variant="secondary" size="sm" />}
            />
          </SectionCard>
          <EmptyNotice title="No archived books" description="Archived titles appear here." />
        </PageShell>
      </StarterThemeProvider>,
    );

    expect(screen.getByText('Merchant Console')).toBeTruthy();
    expect(screen.getByText('Manage storefront catalog')).toBeTruthy();
    expect(screen.getByText('Catalog')).toBeTruthy();
    expect(screen.getByText('Designing Data-Intensive Applications')).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();
    expect(screen.getByText('No archived books')).toBeTruthy();
  });
});
