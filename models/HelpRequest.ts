import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IMatchedHelper {
  userId: mongoose.Types.ObjectId | any;
  score?: number;
  reason?: string;
}

export interface IHelpRequest extends Document {
  seeker: mongoose.Types.ObjectId | IUser;
  title: string;
  description: string;
  category: string;
  urgency: 'flexible' | 'today' | 'urgent';
  location: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  matchedHelpers: IMatchedHelper[];
  acceptedHelper?: mongoose.Types.ObjectId | IUser;
  aiTitle?: string;
  originalLanguage?: string;
  translatedTitle?: string;
  translatedDescription?: string;
  safetyChecked: boolean;
  safetyCategory?: string;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  resolvedAt?: Date;
  expiresAt: Date;
  aiMatchScore?: number;
  aiMatchExplanation?: string;
  aiTags?: string[];
  isUrgent?: boolean;
}

const HelpRequestSchema: Schema<IHelpRequest> = new Schema(
  {
    seeker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true, maxLength: 300 },
    category: { type: String, required: true },
    urgency: { type: String, required: true, enum: ['flexible', 'today', 'urgent'] },
    location: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'completed', 'cancelled', 'expired'],
      default: 'pending',
    },
    matchedHelpers: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      score: { type: Number },
      reason: { type: String }
    }],
    acceptedHelper: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date },
    resolvedAt: { type: Date },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours from creation
    },
    aiTitle: { type: String },
    originalLanguage: { type: String },
    translatedTitle: { type: String },
    translatedDescription: { type: String },
    safetyChecked: { type: Boolean, default: false },
    safetyCategory: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index: { status, category, location } for matching queries
HelpRequestSchema.index({ status: 1, category: 1, location: 1 });
HelpRequestSchema.index({ isUrgent: 1, location: '2dsphere' });

import { getMockModel } from '@/lib/mockDb';

const HelpRequest: any = process.env.USE_MOCK_DB === 'true'
  ? getMockModel('HelpRequest')
  : (mongoose.models.HelpRequest || mongoose.model<IHelpRequest>('HelpRequest', HelpRequestSchema));

export default HelpRequest;
