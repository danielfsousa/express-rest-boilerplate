// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';
import { StarterThemeProvider } from '../StarterThemeProvider.tsx';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Fieldset,
  FieldsetDescription,
  FieldsetLegend,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
  ToggleGroup,
  ToggleGroupItem,
} from './index.ts';

afterEach(() => {
  cleanup();
});

describe('Base UI Stone components', () => {
  test('Accordion expands and collapses items on click', () => {
    render(
      <StarterThemeProvider mode="light">
        <Accordion defaultValue={['first']}>
          <AccordionItem value="first">
            <AccordionTrigger>Shipping details</AccordionTrigger>
            <AccordionContent>Ships within 24 hours.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="second">
            <AccordionTrigger>Returns</AccordionTrigger>
            <AccordionContent>30-day merchant guarantee.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </StarterThemeProvider>,
    );

    const firstTrigger = screen.getByRole('button', { name: 'Shipping details' });
    const secondTrigger = screen.getByRole('button', { name: 'Returns' });
    expect(firstTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(secondTrigger);
    expect(secondTrigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('30-day merchant guarantee.')).toBeTruthy();
  });

  test('Meter renders accessible meter role, label, and value', () => {
    render(
      <StarterThemeProvider mode="light">
        <Meter value={75} min={0} max={100} tone="warning">
          <MeterLabel>Storage quota</MeterLabel>
          <MeterValue />
          <MeterTrack>
            <MeterIndicator />
          </MeterTrack>
        </Meter>
      </StarterThemeProvider>,
    );

    const meter = screen.getByRole('meter', { name: 'Storage quota' });
    expect(meter.getAttribute('aria-valuenow')).toBe('75');
    expect(meter.getAttribute('data-tone')).toBe('warning');
    expect(screen.getByText('75%')).toBeTruthy();
  });

  test('InputOTP renders slots and fires onValueChange', () => {
    const onValueChange = vi.fn();
    render(
      <StarterThemeProvider mode="light">
        <InputOTP length={4} onValueChange={onValueChange} aria-label="Verification code">
          <InputOTPGroup>
            <InputOTPSlot />
            <InputOTPSlot />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot />
            <InputOTPSlot />
          </InputOTPGroup>
        </InputOTP>
      </StarterThemeProvider>,
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(4);
    const firstInput = inputs[0];
    expect(firstInput).toBeDefined();
    if (firstInput) {
      fireEvent.change(firstInput, { target: { value: '7' } });
    }
    expect(onValueChange).toHaveBeenCalledWith('7', expect.anything());
  });

  test('ToggleGroup toggles single and multiple pressed items', () => {
    render(
      <StarterThemeProvider mode="light">
        <ToggleGroup variant="outline" size="sm" multiple defaultValue={['en']}>
          <ToggleGroupItem value="en">EN</ToggleGroupItem>
          <ToggleGroupItem value="pt-BR">PT-BR</ToggleGroupItem>
        </ToggleGroup>
      </StarterThemeProvider>,
    );

    const enButton = screen.getByRole('button', { name: 'EN' });
    const ptButton = screen.getByRole('button', { name: 'PT-BR' });
    expect(enButton.getAttribute('aria-pressed')).toBe('true');
    expect(ptButton.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(ptButton);
    expect(enButton.getAttribute('aria-pressed')).toBe('true');
    expect(ptButton.getAttribute('aria-pressed')).toBe('true');
  });

  test('Fieldset renders legend, description, and propagates disabled state', () => {
    render(
      <StarterThemeProvider mode="light">
        <Fieldset disabled>
          <FieldsetLegend>Storefront settings</FieldsetLegend>
          <FieldsetDescription>Read-only while archived.</FieldsetDescription>
          <button type="button">Save</button>
        </Fieldset>
      </StarterThemeProvider>,
    );

    expect(screen.getByText('Storefront settings')).toBeTruthy();
    expect(screen.getByText('Read-only while archived.')).toBeTruthy();
    const group = screen.getByRole('group', { name: 'Storefront settings' });
    expect(group.hasAttribute('disabled')).toBe(true);
  });
});
