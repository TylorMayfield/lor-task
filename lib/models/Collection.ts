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
  parentId?: mongoose.Types.ObjectId;
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
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
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
CollectionSchema.index({ userId: 1, parentId: 1 });
CollectionSchema.index({ parentId: 1 });

// Clear cached model if it exists to ensure schema changes are picked up
if (mongoose.models?.Collection) {
  delete mongoose.models.Collection;
}

const Collection: Model<ICollection> = mongoose.model<ICollection>('Collection', CollectionSchema);

export default Collection;

