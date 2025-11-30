import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = 
  (mongoose.models && (mongoose.models as any).User) 
    ? (mongoose.models as any).User 
    : mongoose.model<IUser>('User', UserSchema);

export default User;

