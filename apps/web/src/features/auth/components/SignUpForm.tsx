import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { authClient } from '../../../lib/auth-client.ts';

export function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setErrorMessage(result.error.message ?? 'Sign up failed');
        return;
      }
      await navigate({ to: '/' });
    } catch {
      setErrorMessage('Unable to reach authentication server');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <VStack gap="md">
          <Heading level={2}>Create merchant account</Heading>
          {errorMessage ? (
            <Banner status="error" title="Sign up failed" description={errorMessage} />
          ) : null}
          <TextInput
            type="text"
            label="Full name"
            value={name}
            onChange={setName}
            isRequired
            autoComplete="name"
          />
          <TextInput
            type="email"
            label="Email"
            value={email}
            onChange={setEmail}
            isRequired
            autoComplete="email"
          />
          <TextInput
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            isRequired
            autoComplete="new-password"
          />
          <Button type="submit" label="Create account" variant="primary" isLoading={isSubmitting} />
        </VStack>
      </form>
    </Card>
  );
}
