import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ITask extends Document {
  title: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  scheduledDate?: Date;
  tags: mongoose.Types.ObjectId[];
  categoryId?: mongoose.Types.ObjectId;
  boardId?: mongoose.Types.ObjectId;
  isInbox: boolean;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    cadence?: string; // e.g., "first monday", "last friday", "every 2nd tuesday"
    weekOfMonth?: number; // 1-4 for first, second, third, fourth week
    dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    dueDate: {
      type: Date,
    },
    scheduledDate: {
      type: Date,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
    },
    isInbox: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
      daysOfWeek: [Number],
      dayOfMonth: Number,
      cadence: String,
      weekOfMonth: Number,
      dayOfWeek: Number,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, scheduledDate: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ boardId: 1 });
TaskSchema.index({ boardId: 1, status: 1 });
TaskSchema.index({ userId: 1, isInbox: 1 });
TaskSchema.index({ userId: 1, isInbox: 1, status: 1 });

const Task: Model<ITask> = 
  (mongoose.models && (mongoose.models as any).Task) 
    ? (mongoose.models as any).Task 
    : mongoose.model<ITask>('Task', TaskSchema);

export default Task;

