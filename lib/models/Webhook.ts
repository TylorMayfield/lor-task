import mongoose, { Schema, Document, Model } from 'mongoose';

export enum WebhookEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_COMPLETED = 'task.completed',
  TASK_DELETED = 'task.deleted',
  TASK_STATUS_CHANGED = 'task.status_changed',
}

export interface IWebhook extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  active: boolean;
  description?: string;
  headers?: Record<string, string>;
  lastTriggeredAt?: Date;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    secret: {
      type: String,
    },
    events: {
      type: [String],
      enum: Object.values(WebhookEvent),
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
    headers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastTriggeredAt: {
      type: Date,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

WebhookSchema.index({ userId: 1, active: 1 });
WebhookSchema.index({ userId: 1, events: 1 });

const Webhook: Model<IWebhook> =
  (mongoose.models && (mongoose.models as any).Webhook)
    ? (mongoose.models as any).Webhook
    : mongoose.model<IWebhook>('Webhook', WebhookSchema);

export default Webhook;

