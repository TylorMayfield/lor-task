import crypto from 'crypto';
import Webhook, { WebhookEvent, IWebhook } from '../models/Webhook';
import connectDB from '../mongodb';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  userId: string;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Fire webhooks for a specific event
 */
export async function fireWebhooks(
  userId: string,
  event: WebhookEvent,
  data: any
): Promise<void> {
  await connectDB();

  const webhooks = await Webhook.find({
    userId,
    active: true,
    events: event,
  }).lean();

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    userId,
  };

  const payloadString = JSON.stringify(payload);

  // Fire webhooks in parallel (don't await to avoid blocking)
  webhooks.forEach(async (webhook: any) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': payload.timestamp,
        ...webhook.headers,
      };

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = generateWebhookSignature(payloadString, webhook.secret);
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      // Update webhook last triggered time and reset failure count
      await Webhook.findByIdAndUpdate(webhook._id, {
        lastTriggeredAt: new Date(),
        failureCount: 0,
      });
    } catch (error) {
      console.error(`Webhook failed for ${webhook.url}:`, error);

      // Increment failure count
      await Webhook.findByIdAndUpdate(webhook._id, {
        $inc: { failureCount: 1 },
      });

      // Deactivate webhook after 5 consecutive failures
      const updatedWebhook = await Webhook.findById(webhook._id);
      if (updatedWebhook && updatedWebhook.failureCount >= 5) {
        await Webhook.findByIdAndUpdate(webhook._id, { active: false });
        console.log(`Webhook ${webhook._id} deactivated after 5 failures`);
      }
    }
  });
}

/**
 * Validate webhook URL
 */
export function validateWebhookUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

