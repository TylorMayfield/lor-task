import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRecurringTaskHistory extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  originalTaskId: mongoose.Types.ObjectId;
  completedAt: Date;
  amount?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const RecurringTaskHistorySchema: Schema = new Schema(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
    },
    notes: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

RecurringTaskHistorySchema.index({ userId: 1, originalTaskId: 1, completedAt: -1 });
RecurringTaskHistorySchema.index({ taskId: 1 });

const RecurringTaskHistory: Model<IRecurringTaskHistory> =
  (mongoose.models && (mongoose.models as any).RecurringTaskHistory)
    ? (mongoose.models as any).RecurringTaskHistory
    : mongoose.model<IRecurringTaskHistory>('RecurringTaskHistory', RecurringTaskHistorySchema);

export default RecurringTaskHistory;

