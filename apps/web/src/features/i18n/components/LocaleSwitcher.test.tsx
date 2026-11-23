// @vitest-environment jsdom
import { m } from '@starter/i18n';
import { StarterThemeProvider, Text } from '@starter/ui';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import { LocaleProvider, useLocale } from '../LocaleProvider.tsx';
import { LocaleSwitcher } from './LocaleSwitcher.tsx';

afterEach(() => {
  cleanup();
});

function Probe() {
  const { locale } = useLocale();
  return <Text>{m.app_title({}, { locale })}</Text>;
}

describe('LocaleSwitcher', () => {
  test('switches between en and pt-BR when enabled', () => {
    render(
      <StarterThemeProvider>
        <LocaleProvider enabled>
          <LocaleSwitcher />
          <Probe />
        </LocaleProvider>
      </StarterThemeProvider>,
    );

    expect(screen.getByText('Bookstore Platform')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'pt-BR' }));
    expect(screen.getByText('Plataforma de Livraria')).toBeTruthy();
  });

  test('hides switcher and forces en when disabled', () => {
    render(
      <StarterThemeProvider>
        <LocaleProvider enabled={false}>
          <LocaleSwitcher />
          <Probe />
        </LocaleProvider>
      </StarterThemeProvider>,
    );

    expect(screen.getByText('Bookstore Platform')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'pt-BR' })).toBeNull();
  });
});
