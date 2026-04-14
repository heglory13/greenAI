import mongoose, { Schema, Document } from 'mongoose'

export interface IMeterFeedback extends Document {
  readingId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  landlordId: mongoose.Types.ObjectId
  tenantId: mongoose.Types.ObjectId
  status: 'pending' | 'approved' | 'rejected'
  tenantComment?: string
  createdAt: Date
  updatedAt: Date
}

const MeterFeedbackSchema = new Schema<IMeterFeedback>(
  {
    readingId: { type: Schema.Types.ObjectId, ref: 'MeterReading', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    landlordId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    tenantComment: { type: String },
  },
  { timestamps: true }
)

MeterFeedbackSchema.index({ tenantId: 1, status: 1 })
MeterFeedbackSchema.index({ readingId: 1 })

export default mongoose.model<IMeterFeedback>('MeterFeedback', MeterFeedbackSchema)
