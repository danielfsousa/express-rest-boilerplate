import { Banner, Button, Card, Heading, TextInput, VStack } from '@starter/ui';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '#/lib/auth-client.ts';

export function SignUpForm() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        const result = await authClient.signUp.email({
          name: value.name,
          email: value.email,
          password: value.password,
        });
        if (result.error) {
          setErrorMessage(result.error.message ?? 'Sign up failed');
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
        <VStack gap={4}>
          <Heading level={2}>Create merchant account</Heading>
          {errorMessage ? (
            <Banner status="error" title="Sign up failed" description={errorMessage} />
          ) : null}

          <form.Field name="name">
            {(field) => (
              <TextInput
                type="text"
                label="Full name"
                value={field.state.value}
                onChange={field.handleChange}
                isRequired
                autoComplete="name"
              />
            )}
          </form.Field>
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
                autoComplete="new-password"
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting: boolean) => (
              <Button
                type="submit"
                label="Create account"
                variant="primary"
                isLoading={isSubmitting}
              />
            )}
          </form.Subscribe>
        </VStack>
      </form>
    </Card>
  );
}
