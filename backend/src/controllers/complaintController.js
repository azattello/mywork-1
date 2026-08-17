const Complaint = require('../models/Complaint');
const fs = require('fs');
const path = require('path');

// Подать жалобу
exports.createComplaint = async (req, res) => {
  try {
    const { applicationId, reportedUserId, complaintType, description } = req.body;
    const reporterId = req.user._id;

    // Валидация
    if (!applicationId || !reportedUserId || !complaintType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description is too long (max 1000 characters)'
      });
    }

    // Обработать загруженные файлы
    const attachments = [];
    if (req.files && req.files.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      req.files.forEach(file => {
        attachments.push({
          url: `${baseUrl}/uploads/${file.filename}`,
          filename: file.originalname,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });
      });
    }

    // Создать жалобу
    const complaint = await Complaint.create({
      application: applicationId,
      reporter: reporterId,
      reportedUser: reportedUserId,
      complaintType,
      description,
      attachments
    });

    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить жалобы для конкретного заказа
exports.getComplaintsByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find({ application: applicationId })
      .populate('reporter', 'name surname avatarUrl')
      .populate('reportedUser', 'name surname avatarUrl')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Complaint.countDocuments({ application: applicationId });

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parseInt(limit) < total
      }
    });
  } catch (err) {
    console.error('Error getting complaints:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить жалобы на конкретного пользователя (для админов)
exports.getComplaintsAboutUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, status = null } = req.query;
    const skip = (page - 1) * limit;

    const filter = { reportedUser: userId };
    if (status) {
      filter.status = status;
    }

    const complaints = await Complaint.find(filter)
      .populate('reporter', 'name surname avatarUrl')
      .populate('application', '_id title status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parseInt(limit) < total
      }
    });
  } catch (err) {
    console.error('Error getting complaints:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить жалобу по ID
exports.getComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;

    const complaint = await Complaint.findById(complaintId)
      .populate('reporter', 'name surname avatarUrl phone')
      .populate('reportedUser', 'name surname avatarUrl')
      .populate('application');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    console.error('Error getting complaint:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Обновить статус жалобы (только админ)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, priority, resolution, adminComment } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (resolution) updates.resolution = resolution;
    if (adminComment) updates.adminComment = adminComment;

    // Если жалоба разрешена, добавить timestamp
    if (status === 'resolved' || status === 'rejected') {
      updates.resolvedAt = new Date();
    }

    if (status === 'in_review') {
      updates.reviewedAt = new Date();
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { $set: updates },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    console.error('Error updating complaint:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Получить жалобы для администратора (все жалобы)
exports.getAllComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = null, priority = null } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate('reporter', 'name surname avatarUrl')
      .populate('reportedUser', 'name surname avatarUrl')
      .populate('application', '_id title status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const total = await Complaint.countDocuments(filter);

    res.json({
      success: true,
      data: complaints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + parseInt(limit) < total
      }
    });
  } catch (err) {
    console.error('Error getting complaints:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// Удалить жалобу (только автор или админ)
exports.deleteComplaint = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const complaint = await Complaint.findById(complaintId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Проверить права доступа
    if (complaint.reporter.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this complaint'
      });
    }

    // Удалить загруженные файлы
    if (complaint.attachments && complaint.attachments.length > 0) {
      complaint.attachments.forEach(att => {
        const filename = att.url.split('/').pop();
        const filepath = path.join(__dirname, '..', '..', 'uploads', filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });
    }

    await Complaint.findByIdAndDelete(complaintId);

    res.json({
      success: true,
      data: { message: 'Complaint deleted' }
    });
  } catch (err) {
    console.error('Error deleting complaint:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};
