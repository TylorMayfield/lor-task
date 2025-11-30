import mongoose, { Schema, Document, Model } from 'mongoose';

export enum BoardPermission {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface IBoard extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  color?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

BoardSchema.index({ createdBy: 1 });
BoardSchema.index({ isPublic: 1 });

const Board: Model<IBoard> =
  (mongoose.models && (mongoose.models as any).Board) 
    ? (mongoose.models as any).Board 
    : mongoose.model<IBoard>('Board', BoardSchema);

export default Board;

