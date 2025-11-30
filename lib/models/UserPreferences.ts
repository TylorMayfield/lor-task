import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  workHours: {
    start: number; // Hour of day (0-23)
    end: number;
  };
  preferredDays: number[]; // Days of week (0-6, Sunday = 0)
  autoTagging: boolean;
  smartScheduling: boolean;
  mlLearning: boolean;
  primaryColor: string; // Hex color code
  customTagColors: Record<string, string>;
  notificationSettings: {
    email: boolean;
    push: boolean;
    reminderBeforeDue: number; // Hours before due date
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    defaultPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    workHours: {
      start: {
        type: Number,
        default: 9,
        min: 0,
        max: 23,
      },
      end: {
        type: Number,
        default: 17,
        min: 0,
        max: 23,
      },
    },
    preferredDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5], // Monday to Friday
    },
    autoTagging: {
      type: Boolean,
      default: true,
    },
    smartScheduling: {
      type: Boolean,
      default: true,
    },
    mlLearning: {
      type: Boolean,
      default: true,
    },
    primaryColor: {
      type: String,
      default: '#3b82f6', // Default blue
    },
    customTagColors: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notificationSettings: {
      email: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: true,
      },
      reminderBeforeDue: {
        type: Number,
        default: 24, // 24 hours
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserPreferences: Model<IUserPreferences> =
  (mongoose.models && (mongoose.models as any).UserPreferences)
    ? (mongoose.models as any).UserPreferences
    : mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);

export default UserPreferences;

