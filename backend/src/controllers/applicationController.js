const mongoose = require('mongoose');
const Application = require('../models/Application');
const FallbackStore = require('../services/fallbackStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all applications for logged-in user with search, filter, and sorting
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;

    if (!isDbConnected()) {
      const applications = await FallbackStore.getApplications(req.user._id, { search, status, sort });
      return res.status(200).json({
        success: true,
        count: applications.length,
        applications,
      });
    }

    // Strict user data isolation
    const query = { user: req.user._id };

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Search by company or role
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ company: searchRegex }, { role: searchRegex }];
    }

    // Build sort option
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'deadline_asc') {
      sortOption = { deadline: 1 };
    } else if (sort === 'deadline_desc') {
      sortOption = { deadline: -1 };
    } else if (sort === 'applied_asc') {
      sortOption = { dateApplied: 1 };
    } else if (sort === 'applied_desc') {
      sortOption = { dateApplied: -1 };
    } else if (sort === 'company_asc') {
      sortOption = { company: 1 };
    } else if (sort === 'company_desc') {
      sortOption = { company: -1 };
    }

    const applications = await Application.find(query).sort(sortOption);

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Private
const getApplicationById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      const application = await FallbackStore.getApplicationById(req.params.id, req.user._id);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access',
        });
      }
      return res.status(200).json({
        success: true,
        application,
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized access',
      });
    }

    res.status(200).json({
      success: true,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new internship application
// @route   POST /api/applications
// @access  Private
const createApplication = async (req, res, next) => {
  try {
    const {
      company,
      role,
      applicationUrl,
      location,
      salary,
      dateApplied,
      deadline,
      status,
      notes,
      interviewDate,
    } = req.body;

    if (!company || !company.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required',
      });
    }

    if (!role || !role.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Role title is required',
      });
    }

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    if (!isDbConnected()) {
      const application = await FallbackStore.createApplication(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Internship application created successfully',
        application,
      });
    }

    const application = await Application.create({
      user: req.user._id,
      company: company.trim(),
      role: role.trim(),
      applicationUrl: applicationUrl ? applicationUrl.trim() : '',
      location: location ? location.trim() : 'Remote',
      salary: salary ? salary.trim() : '',
      dateApplied: parseDate(dateApplied) || new Date(),
      deadline: parseDate(deadline),
      status: status || 'Applied',
      notes: notes ? notes.trim() : '',
      interviewDate: parseDate(interviewDate),
    });

    res.status(201).json({
      success: true,
      message: 'Internship application created successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing internship application
// @route   PUT /api/applications/:id
// @access  Private
const updateApplication = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      const updated = await FallbackStore.updateApplication(req.params.id, req.user._id, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Application updated successfully',
        application: updated,
      });
    }

    let application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized access',
      });
    }

    const {
      company,
      role,
      applicationUrl,
      location,
      salary,
      dateApplied,
      deadline,
      status,
      notes,
      interviewDate,
    } = req.body;

    const parseDate = (val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    if (company !== undefined) application.company = company.trim();
    if (role !== undefined) application.role = role.trim();
    if (applicationUrl !== undefined) application.applicationUrl = applicationUrl.trim();
    if (location !== undefined) application.location = location.trim();
    if (salary !== undefined) application.salary = salary.trim();
    if (dateApplied !== undefined) application.dateApplied = parseDate(dateApplied) || application.dateApplied;
    if (deadline !== undefined) application.deadline = parseDate(deadline);
    if (status !== undefined) application.status = status;
    if (notes !== undefined) application.notes = notes.trim();
    if (interviewDate !== undefined) application.interviewDate = parseDate(interviewDate);

    const updatedApplication = await application.save();

    res.status(200).json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update status (useful for Pipeline Kanban columns)
// @route   PATCH /api/applications/:id/status
// @access  Private
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    if (!isDbConnected()) {
      const application = await FallbackStore.updateApplication(req.params.id, req.user._id, { status });
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access',
        });
      }
      return res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        application,
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized access',
      });
    }

    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an application
// @route   DELETE /api/applications/:id
// @access  Private
const deleteApplication = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      const deleted = await FallbackStore.deleteApplication(req.params.id, req.user._id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Application not found or unauthorized access',
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Application deleted successfully',
        id: req.params.id,
      });
    }

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found or unauthorized access',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
      id: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics and statistics
// @route   GET /api/applications/stats/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (!isDbConnected()) {
      const stats = await FallbackStore.getStats(userId);
      const allApps = await FallbackStore.getApplications(userId, {});
      return res.status(200).json({
        success: true,
        stats: {
          totalApplications: stats.total,
          inProgress: stats.inProgress,
          interviewsScheduled: stats.interview,
          offersReceived: stats.offer,
          rejectedCount: stats.rejected,
          overdueCount: 0,
          upcomingDeadlines: allApps.filter((a) => a.deadline).slice(0, 5),
          statusCounts: stats.byStatus,
          recentActivity: allApps.slice(0, 5),
        },
      });
    }

    const allApps = await Application.find({ user: userId }).sort({ updatedAt: -1 });

    const totalApplications = allApps.length;
    const inProgress = allApps.filter((a) =>
      ['Applied', 'Assessment', 'Interview'].includes(a.status)
    ).length;
    const interviewsScheduled = allApps.filter(
      (a) => a.status === 'Interview' || (a.interviewDate && new Date(a.interviewDate) >= new Date())
    ).length;
    const offersReceived = allApps.filter((a) => a.status === 'Offer').length;
    const rejectedCount = allApps.filter((a) => a.status === 'Rejected').length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcomingDeadlines = allApps
      .filter((a) => a.deadline && new Date(a.deadline) >= now && a.status !== 'Offer' && a.status !== 'Rejected')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    const overdueCount = allApps.filter(
      (a) => a.deadline && new Date(a.deadline) < now && a.status !== 'Offer' && a.status !== 'Rejected'
    ).length;

    const statusCounts = {
      Applied: allApps.filter((a) => a.status === 'Applied').length,
      Assessment: allApps.filter((a) => a.status === 'Assessment').length,
      Interview: allApps.filter((a) => a.status === 'Interview').length,
      Offer: offersReceived,
      Rejected: rejectedCount,
    };

    const recentActivity = allApps.slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        inProgress,
        interviewsScheduled,
        offersReceived,
        rejectedCount,
        overdueCount,
        upcomingDeadlines,
        statusCounts,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getDashboardStats,
};
