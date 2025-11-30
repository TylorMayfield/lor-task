import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Webhook, { WebhookEvent } from '@/lib/models/Webhook';
import { validateWebhookUrl } from '@/lib/webhooks/webhookService';
import { getSession } from '@/lib/api/getSession';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const webhook = await Webhook.findOne({
      _id: params.id,
      userId: session.user.id,
    }).lean();

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ webhook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const webhook = await Webhook.findOne({
      _id: params.id,
      userId: session.user.id,
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Validate URL if provided
    if (body.url && !validateWebhookUrl(body.url)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must be http:// or https://' },
        { status: 400 }
      );
    }

    // Validate events if provided
    if (body.events) {
      const validEvents = Object.values(WebhookEvent);
      const invalidEvents = body.events.filter(
        (e: string) => !validEvents.includes(e as WebhookEvent)
      );
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          { error: `Invalid events: ${invalidEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    Object.assign(webhook, body);
    await webhook.save();

    return NextResponse.json({ webhook });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const webhook = await Webhook.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

