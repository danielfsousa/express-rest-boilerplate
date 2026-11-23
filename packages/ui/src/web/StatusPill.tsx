import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import type { StatusDotVariant } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';

export type StatusPillTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface StatusPillProps {
  tone?: StatusPillTone;
  label: string;
  isPulsing?: boolean;
}

const TONE_TO_DOT_VARIANT: Record<StatusPillTone, StatusDotVariant> = {
  neutral: 'neutral',
  info: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/** Accessible status indicator pairing a StatusDot with a visible text label. */
export function StatusPill({ tone = 'neutral', label, isPulsing = false }: StatusPillProps) {
  return (
    <HStack align="center" gap={1}>
      <StatusDot variant={TONE_TO_DOT_VARIANT[tone]} label={label} isPulsing={isPulsing} />
      <Text color="secondary">{label}</Text>
    </HStack>
  );
}
