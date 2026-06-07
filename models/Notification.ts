import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId | IUser;
  type: 'new_match' | 'request_accepted' | 'message' | 'rating_received' | 'request_expired';
  title: string;
  body: string;
  meta: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['new_match', 'request_accepted', 'message', 'rating_received', 'request_expired'],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

// Index for fast query of recipient's notifications (especially sorting by date and checking read/unread)
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

import { getMockModel } from '@/lib/mockDb';

const Notification: any = process.env.USE_MOCK_DB === 'true'
  ? getMockModel('Notification')
  : (mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema));

export default Notification;
