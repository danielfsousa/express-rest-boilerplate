// @vitest-environment jsdom
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { m } from '@starter/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import { LocaleSwitcher } from './LocaleSwitcher.tsx';
import { LocaleProvider, useLocale } from '../LocaleProvider.tsx';

afterEach(() => {
  cleanup();
});

function Probe() {
  const { locale } = useLocale();
  return <span>{m.app_title({}, { locale })}</span>;
}

describe('LocaleSwitcher', () => {
  test('switches between en and pt-BR when enabled', () => {
    render(
      <Theme theme={neutralTheme}>
        <LocaleProvider enabled>
          <LocaleSwitcher />
          <Probe />
        </LocaleProvider>
      </Theme>,
    );

    expect(screen.getByText('Bookstore Platform')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'pt-BR' }));
    expect(screen.getByText('Plataforma de Livraria')).toBeTruthy();
  });

  test('hides switcher and forces en when disabled', () => {
    render(
      <Theme theme={neutralTheme}>
        <LocaleProvider enabled={false}>
          <LocaleSwitcher />
          <Probe />
        </LocaleProvider>
      </Theme>,
    );

    expect(screen.getByText('Bookstore Platform')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'pt-BR' })).toBeNull();
  });
});
