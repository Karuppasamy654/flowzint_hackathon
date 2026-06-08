import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  bio?: string;
  location: string;
  skills: string[];
  avatarUrl?: string;
  avatarColor: string;
  preferredLanguage: string;
  rating: {
    total: number;
    count: number;
  };
  avgRating: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, maxLength: 120 },
    location: { type: String, required: true },
    skills: { type: [String], default: [] },
    avatarUrl: { type: String },
    avatarColor: {
      type: String,
      required: true,
      enum: ['#7C3AED', '#0F766E', '#B45309', '#1D4ED8', '#9D174D', '#065F46', '#C2410C', '#1A7F5A'],
    },
    preferredLanguage: { type: String, default: 'en' },
    rating: {
      total: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for average rating
UserSchema.virtual('avgRating').get(function (this: IUser) {
  if (!this.rating || this.rating.count === 0) {
    return 0;
  }
  return this.rating.total / this.rating.count;
});

import { getMockModel } from '@/lib/mockDb';

const User: any = process.env.USE_MOCK_DB === 'true'
  ? getMockModel('User')
  : (mongoose.models.User || mongoose.model<IUser>('User', UserSchema));
export default User;
