import { Banner, Button, Card, Heading, TextInput, VStack } from '@starter/ui';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '#/lib/auth-client.ts';

export function SignInForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        const result = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          setErrorMessage(result.error.message ?? 'Sign in failed');
          return;
        }
        await navigate({ to: '/' });
      } catch {
        setErrorMessage('Unable to reach authentication server');
      }
    },
  });

  return (
    <Card>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <VStack gap="md">
          <Heading level={2}>Sign in</Heading>
          {errorMessage ? (
            <Banner status="error" title="Sign in failed" description={errorMessage} />
          ) : null}

          <form.Field name="email">
            {(field) => (
              <TextInput
                type="email"
                label="Email"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
                autoComplete="email"
              />
            )}
          </form.Field>
          <form.Field name="password">
            {(field) => (
              <TextInput
                type="password"
                label="Password"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
                autoComplete="current-password"
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting: boolean) => (
              <Button type="submit" label="Sign in" variant="primary" isLoading={isSubmitting} />
            )}
          </form.Subscribe>
        </VStack>
      </form>
    </Card>
  );
}
