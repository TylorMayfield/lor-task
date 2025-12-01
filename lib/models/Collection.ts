import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  description?: string;
  color?: string;
  icon?: string;
  filterCriteria?: {
    tags?: string[];
    priority?: string[];
    status?: string[];
    boardId?: mongoose.Types.ObjectId;
    categoryId?: mongoose.Types.ObjectId;
    hasDueDate?: boolean;
    isRecurring?: boolean;
  };
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: {
      type: String,
    },
    filterCriteria: {
      tags: [String],
      priority: [String],
      status: [String],
      boardId: {
        type: Schema.Types.ObjectId,
        ref: 'Board',
      },
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
      hasDueDate: Boolean,
      isRecurring: Boolean,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

CollectionSchema.index({ userId: 1 });
CollectionSchema.index({ userId: 1, order: 1 });

const Collection: Model<ICollection> =
  mongoose.models?.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;

