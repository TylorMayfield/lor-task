import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Webhook, { WebhookEvent } from '@/lib/models/Webhook';
import { validateWebhookUrl } from '@/lib/webhooks/webhookService';
import { getSession } from '@/lib/api/getSession';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const webhooks = await Webhook.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ webhooks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { url, events, secret, description, headers } = body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'URL and events are required' },
        { status: 400 }
      );
    }

    if (!validateWebhookUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must be http:// or https://' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents = Object.values(WebhookEvent);
    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(', ')}` },
        { status: 400 }
      );
    }

    const webhook = await Webhook.create({
      userId: session.user.id,
      url,
      events,
      secret: secret || undefined,
      description,
      headers: headers || {},
      active: true,
    });

    return NextResponse.json({ webhook }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

