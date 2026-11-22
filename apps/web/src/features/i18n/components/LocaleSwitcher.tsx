import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { SUPPORTED_LOCALES } from '@starter/i18n';
import { useLocale } from '../LocaleProvider.tsx';

export function LocaleSwitcher() {
  const { locale, setLocale, enabled } = useLocale();

  if (!enabled) {
    return null;
  }

  return (
    <HStack gap="xs" align="center">
      {SUPPORTED_LOCALES.map((candidate) => (
        <Button
          key={candidate}
          label={candidate}
          size="sm"
          variant={locale === candidate ? 'primary' : 'ghost'}
          onClick={() => {
            setLocale(candidate);
          }}
        />
      ))}
    </HStack>
  );
}
