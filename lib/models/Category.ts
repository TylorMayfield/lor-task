import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  color?: string;
  icon?: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
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
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: {
      type: String,
    },
    description: {
      type: String,
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

CategorySchema.index({ userId: 1, parentId: 1 });
CategorySchema.index({ userId: 1 });

const Category: Model<ICategory> =
  (mongoose.models && (mongoose.models as any).Category)
    ? (mongoose.models as any).Category
    : mongoose.model<ICategory>('Category', CategorySchema);

export default Category;

