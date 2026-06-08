import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';
import { IHelpRequest } from './HelpRequest';

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
  readBy: mongoose.Types.ObjectId[];
  originalText?: string;
  originalLanguage?: string;
  translations?: Record<string, string> | any;
}

export interface IChat extends Document {
  request: mongoose.Types.ObjectId | IHelpRequest;
  seeker: mongoose.Types.ObjectId | IUser;
  helper: mongoose.Types.ObjectId | IUser;
  messages: IMessage[];
  status: 'active' | 'resolved';
  seekerRating?: number;
  seekerFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  originalText: { type: String },
  originalLanguage: { type: String },
  translations: { type: Map, of: String, default: {} },
});

const ChatSchema: Schema<IChat> = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: 'HelpRequest', required: true },
    seeker: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    helper: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: [MessageSchema],
    status: { type: String, required: true, enum: ['active', 'resolved'], default: 'active' },
    seekerRating: { type: Number, min: 1, max: 5 },
    seekerFeedback: { type: String },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

import { getMockModel } from '@/lib/mockDb';

const Chat: any = process.env.USE_MOCK_DB === 'true'
  ? getMockModel('Chat')
  : (mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema));
export default Chat;
