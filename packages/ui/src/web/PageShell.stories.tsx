import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner, Button, PageShell, SectionCard, Text } from './index.ts';

const meta: Meta<typeof PageShell> = {
  title: 'Web/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Page heading.' },
    subtitle: { control: 'text', description: 'Supporting subtitle under the heading.' },
    banner: { control: false, description: 'Optional top alert Banner.' },
    actions: { control: false, description: 'Header action buttons.' },
    children: { control: false, description: 'Main page body sections.' },
  },
};

export default meta;

type Story = StoryObj<typeof PageShell>;

export const Default: Story = {
  args: {
    title: 'Merchant Console',
    subtitle: 'Manage storefront catalog and orders',
    actions: (
      <>
        <Button label="Storefront" variant="secondary" size="sm" />
        <Button label="New Book" variant="primary" size="sm" />
      </>
    ),
    children: (
      <SectionCard title="Overview" description="Storefront activity">
        <Text color="secondary">Everything is running smoothly.</Text>
      </SectionCard>
    ),
  },
};

export const WithBanner: Story = {
  args: {
    ...Default.args,
    banner: (
      <Banner
        status="warning"
        title="Impersonating merchant@example.com"
        description="Actions you perform run as this user."
      >
        <Button label="Stop impersonating" variant="secondary" size="sm" />
      </Banner>
    ),
  },
};
