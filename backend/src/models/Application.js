const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      required: [true, 'Internship role/position is required'],
      trim: true,
      maxlength: [100, 'Role title cannot exceed 100 characters'],
    },
    applicationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: 'Remote',
    },
    salary: {
      type: String,
      trim: true,
      default: '',
    },
    dateApplied: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Applied',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    interviewDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user searches & filtering
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, deadline: 1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
