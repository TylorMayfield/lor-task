import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITag extends Document {
  name: string;
  color?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TagSchema.index({ userId: 1, name: 1 }, { unique: true });

const Tag: Model<ITag> = 
  (mongoose.models && (mongoose.models as any).Tag) 
    ? (mongoose.models as any).Tag 
    : mongoose.model<ITag>('Tag', TagSchema);

export default Tag;

