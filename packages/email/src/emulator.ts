export interface CapturedBirdEmail {
  id: string;
  receivedAt: string;
  to: Array<string>;
  from: string;
  subject: string;
  html: string;
  text: string;
}

function parseBirdPayload(raw: unknown): Omit<CapturedBirdEmail, 'id' | 'receivedAt'> {
  if (typeof raw !== 'object' || raw === null) {
    return { to: [], from: '', subject: '', html: '', text: '' };
  }

  const recipients =
    'recipients' in raw && Array.isArray(raw.recipients)
      ? raw.recipients
          .map((item: unknown) => {
            if (
              typeof item === 'object' &&
              item !== null &&
              'address' in item &&
              typeof item.address === 'object' &&
              item.address !== null &&
              'email' in item.address &&
              typeof item.address.email === 'string'
            ) {
              return item.address.email;
            }
            return null;
          })
          .filter((email): email is string => email !== null)
      : [];

  let from = '';
  if (
    'sender' in raw &&
    typeof raw.sender === 'object' &&
    raw.sender !== null &&
    'address' in raw.sender &&
    typeof raw.sender.address === 'object' &&
    raw.sender.address !== null &&
    'email' in raw.sender.address &&
    typeof raw.sender.address.email === 'string'
  ) {
    from = raw.sender.address.email;
  }

  let subject = '';
  let html = '';
  let text = '';
  if ('content' in raw && typeof raw.content === 'object' && raw.content !== null) {
    if ('subject' in raw.content && typeof raw.content.subject === 'string') {
      subject = raw.content.subject;
    }
    if ('html' in raw.content && typeof raw.content.html === 'string') {
      html = raw.content.html;
    }
    if ('text' in raw.content && typeof raw.content.text === 'string') {
      text = raw.content.text;
    }
  }

  return { to: recipients, from, subject, html, text };
}

export function createBirdEmulatorFetch(): (request: Request) => Promise<Response> {
  const messages: Array<CapturedBirdEmail> = [];

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/v1/email/messages') {
      const payload: unknown = await request.json();
      const parsed = parseBirdPayload(payload);
      const id = crypto.randomUUID();
      messages.push({
        id,
        receivedAt: new Date().toISOString(),
        ...parsed,
      });
      return Response.json({ id, status: 'accepted' }, { status: 202 });
    }

    if (request.method === 'GET' && url.pathname === '/__messages') {
      return Response.json({ messages }, { status: 200 });
    }

    if (request.method === 'DELETE' && url.pathname === '/__messages') {
      messages.length = 0;
      return Response.json({ cleared: true }, { status: 200 });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  };
}
