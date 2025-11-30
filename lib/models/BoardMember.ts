import mongoose, { Schema, Document, Model } from 'mongoose';
import { BoardPermission } from './Board';

export interface IBoardMember extends Document {
  boardId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  permission: BoardPermission;
  invitedBy: mongoose.Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BoardMemberSchema: Schema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: Object.values(BoardPermission),
      default: BoardPermission.MEMBER,
      required: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

BoardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });
BoardMemberSchema.index({ userId: 1 });
BoardMemberSchema.index({ boardId: 1 });

const BoardMember: Model<IBoardMember> =
  (mongoose.models && (mongoose.models as any).BoardMember)
    ? (mongoose.models as any).BoardMember
    : mongoose.model<IBoardMember>('BoardMember', BoardMemberSchema);

export default BoardMember;

