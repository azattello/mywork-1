const Response = require('../models/Response');
const Application = require('../models/Application');
const User = require('../models/User');
const notificationController = require('./notificationController');

exports.createResponse = async (req, res) => {
  const { applicationId } = req.params;
  const { message, price, offeredPrice, estimatedDuration, description } = req.body;
  const specialistId = req.user._id;

  console.log('=== CREATE RESPONSE DEBUG ===');
  console.log('applicationId:', applicationId);
  console.log('specialistId:', specialistId);
  console.log('req.body:', req.body);
  console.log('offeredPrice:', offeredPrice, 'type:', typeof offeredPrice);
  console.log('=====');

  // Validate and use offeredPrice or price
  let finalPrice = null;
  if (offeredPrice !== undefined && offeredPrice !== null) {
    finalPrice = parseFloat(offeredPrice);
    console.log('Parsed finalPrice:', finalPrice);
    if (isNaN(finalPrice) || finalPrice < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }
  } else if (price !== undefined && price !== null) {
    finalPrice = parseFloat(price);
    if (isNaN(finalPrice) || finalPrice < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }
  }

  const finalMessage = message || description || '';

  // Check if application exists
  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  console.log('Application found:', application._id);
  console.log('application.user:', application.user.toString());
  console.log('specialistId:', specialistId.toString());

  // Cannot respond to own application
  if (application.user.toString() === specialistId.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot respond to your own application' });
  }

  // Cannot respond to inactive applications
  if (!application.active || application.status !== 'open') {
    console.log('Application not active:', !application.active, 'Status:', application.status);
    return res.status(400).json({ success: false, message: 'Application is no longer accepting responses' });
  }

  try {
    const response = new Response({
      application: applicationId,
      specialist: specialistId,
      message: finalMessage,
      price: finalPrice
    });
    console.log('Response object created:', response);
    await response.save();

    // Populate specialist data
    await response.populate('specialist', 'name surname avatarUrl');

    console.log('Response saved successfully');
    
    // Send notification to application owner
    const io = req.app.get('io');
    const specialist = await User.findById(specialistId).select('name surname');
    if (application.user) {
      await notificationController.createNotification(
        application.user,
        'new_response',
        'Новый отклик на ваш заказ',
        `${specialist?.name || 'Специалист'} откликнулся на ваш заказ "${application.title}"`,
        { applicationId, responseId: response._id, specialistId },
        io
      );
    }

    res.status(201).json({ success: true, data: response });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      console.error('Duplicate key error:', error);
      return res.status(400).json({ success: false, message: 'You have already responded to this application' });
    }
    console.error('Error creating response:', error);
    return res.status(500).json({ success: false, message: 'Error creating response', error: error.message });
  }
};

exports.getApplicationResponses = async (req, res) => {
  const { applicationId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const isOwner = application.user.toString() === req.user._id.toString();
  const isSpecialist = !!req.user._id;

  if (!isOwner && !isSpecialist) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (!isOwner) {
    const myResponse = await Response.findOne({
      application: applicationId,
      specialist: req.user._id,
    }).populate('specialist', 'name surname avatarUrl');

    if (!myResponse) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: [myResponse] });
  }

  const responses = await Response.find({ application: applicationId })
    .populate('specialist', 'name surname avatarUrl')
    .sort('-createdAt');

  res.json({ success: true, data: responses });
};

exports.acceptResponse = async (req, res) => {
  // Client selects a specialist: mark as proposed and wait for specialist confirmation
  const { applicationId, responseId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  // Check permissions
  if (application.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const response = await Response.findById(responseId);
  if (!response || response.application.toString() !== applicationId) {
    return res.status(404).json({ success: false, message: 'Response not found' });
  }

  // Set proposed specialist and immediately hide the application from the public feed
  application.proposedSpecialist = response.specialist;
  application.pendingSpecialistConfirmation = true;
  application.currentSpecialist = null;
  application.active = false;
  application.status = 'open';
  await application.save();

  response.status = 'pending';
  await response.save();

  // Notify specialist via socket
  try {
    const io = req.app.get('io');
    if (io) {
      io.to('user_' + String(response.specialist)).emit('proposal_selected', {
        applicationId,
        responseId,
        message: 'Клиент выбрал вас как специалиста, подтвердите, пожалуйста.'
      });
    }
  } catch (e) {
    console.warn('Proposal select notify failed', e.message || e);
  }

  res.json({ success: true, data: { application, response } });
};

// Specialist confirms selected proposal
exports.confirmResponse = async (req, res) => {
  const { applicationId, responseId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  const response = await Response.findById(responseId);
  if (!response || response.application.toString() !== applicationId) return res.status(404).json({ success: false, message: 'Response not found' });

  // Only the proposed specialist can confirm
  if (!application.proposedSpecialist || application.proposedSpecialist.toString() !== response.specialist.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized to confirm' });
  }

  // Update application and response status to in_progress
  application.currentSpecialist = response.specialist;
  application.status = 'in_progress';
  application.pendingSpecialistConfirmation = false;
  application.proposedSpecialist = null;
  application.active = false; // make private / remove from search
  application.updatedAt = new Date();
  await application.save();

  response.status = 'accepted';
  await response.save();

  // Reject all other responses
  await Response.updateMany(
    { application: applicationId, _id: { $ne: responseId } },
    { status: 'rejected' }
  );

  // Notify application owner and specialist
  try {
    const io = req.app.get('io');
    if (io) {
      io.to('user_' + String(application.user)).emit('proposal_confirmed', { applicationId, responseId });
      io.to('user_' + String(response.specialist)).emit('proposal_confirmed', { applicationId, responseId });
    }
  } catch (e) {}

  res.json({ success: true, data: { application, response } });
};

exports.rejectResponse = async (req, res) => {
  const { applicationId, responseId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  // Check permissions
  if (application.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const response = await Response.findById(responseId);
  if (!response || response.application.toString() !== applicationId) {
    return res.status(404).json({ success: false, message: "Response not found" });
  }

  // Update response status to rejected
  response.status = "rejected";
  await response.save();

  res.json({ success: true, data: response });
};

// Specialist declines their response (or declines client selection)
exports.declineResponse = async (req, res) => {
  const { applicationId, responseId } = req.params;

  const response = await Response.findById(responseId);
  if (!response || response.application.toString() !== applicationId) return res.status(404).json({ success: false, message: 'Response not found' });

  // Only the specialist themselves can decline here
  if (response.specialist.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

  response.status = 'rejected';
  await response.save();

  // If application had this as proposedSpecialist, clear proposal
  const application = await Application.findById(applicationId);
  if (application && application.proposedSpecialist && application.proposedSpecialist.toString() === req.user._id.toString()) {
    application.proposedSpecialist = null;
    application.pendingSpecialistConfirmation = false;
    await application.save();
  }

  // Notify application owner
  try {
    const io = req.app.get('io');
    if (io && application && application.user) {
      io.to('user_' + String(application.user)).emit('proposal_declined', { applicationId, responseId });
    }
  } catch (e) {}

  res.json({ success: true, data: response });
};

// Get single response by application and specialistId
exports.getResponseForSpecialist = async (req, res) => {
  const { applicationId, specialistId } = req.params;

  const application = await Application.findById(applicationId);
  if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

  // Only application owner or the specialist themselves can fetch this
  if (req.user._id.toString() !== application.user.toString() && req.user._id.toString() !== specialistId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const response = await Response.findOne({ application: applicationId, specialist: specialistId });
  if (!response) return res.status(404).json({ success: false, message: 'Response not found' });

  res.json({ success: true, data: response });
};

// Mark work as complete (specialist)
exports.markWorkComplete = async (req, res) => {
  const { applicationId } = req.params;
  const specialistId = req.user._id;

  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Only current specialist can mark complete
    if (application.currentSpecialist.toString() !== specialistId.toString()) {
      return res.status(403).json({ success: false, message: 'Only assigned specialist can mark complete' });
    }

    // Application must be in progress
    if (application.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Application must be in progress' });
    }

    // Update application
    application.workCompleted = true;
    await application.save();

    // Emit socket event to client
    try {
      const io = req.app.get('io');
      if (io && application.user) {
        io.to('user_' + String(application.user)).emit('work_marked_complete', { applicationId });
      }
    } catch (e) {}

    res.json({ success: true, data: application });
  } catch (err) {
    console.error('Error marking work complete:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Accept work as complete (client)
exports.acceptWork = async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user._id;

  try {
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Only application owner can accept work
    if (application.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Only application owner can accept work' });
    }

    // Work must be marked complete
    if (!application.workCompleted) {
      return res.status(400).json({ success: false, message: 'Work must be marked complete first' });
    }

    // Update application
    application.workAccepted = true;
    application.status = 'closed';
    application.completedAt = application.completedAt || new Date();
    application.active = false;
    await application.save();

    // Emit socket event to specialist
    try {
      const io = req.app.get('io');
      if (io && application.currentSpecialist) {
        io.to('specialist_' + String(application.currentSpecialist)).emit('work_accepted', { applicationId });
      }
    } catch (e) {}

    res.json({ success: true, data: application });
  } catch (err) {
    console.error('Error accepting work:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create review
const recalculateUserRating = async (userId) => {
  const Review = require('../models/Review');
  const reviews = await Review.find({
    $or: [
      { toUser: userId },
      { to: userId }
    ]
  });
  const total = reviews.length;

  if (total === 0) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        rating: 0,
        reviewsCount: 0,
        reviewCount: 0,
      }
    }, { new: true });
    return;
  }

  const avgRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / total;
  await User.findByIdAndUpdate(userId, {
    $set: {
      rating: Number(avgRating.toFixed(1)),
      reviewsCount: total,
      reviewCount: total,
    }
  }, { new: true });
};

exports.createReview = async (req, res) => {
  const { applicationId } = req.params;
  const { rating, text } = req.body;
  const userId = req.user._id;

  try {
    // Validate input
    if (!rating || !text || text.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Rating and text (min 10 chars) required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Work must be accepted and application closed/completed
    if (!application.workAccepted) {
      return res.status(400).json({ success: false, message: 'Work must be accepted first' });
    }

    if (application.status !== 'closed' && application.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Application must be closed before review' });
    }

    // Either client or specialist can review
    const isClient = application.user.toString() === userId.toString();
    const isSpecialist = application.currentSpecialist && application.currentSpecialist.toString() === userId.toString();

    if (!isClient && !isSpecialist) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const Review = require('../models/Review');

    // Check if review already exists for this user
    const existingReview = await Review.findOne({
      application: applicationId,
      author: userId,
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You already left a review' });
    }

    // Create review
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const targetUserId = isClient ? application.currentSpecialist : application.user;

    const review = new Review({
      application: applicationId,
      author: userId,
      from: userId,
      to: targetUserId,
      rating: parseInt(rating),
      text: text.trim(),
      image: imageUrl,
      toUser: targetUserId,
    });

    await review.save();
    await recalculateUserRating(targetUserId);

    // Check if both parties have reviewed
    const allReviews = await Review.find({ application: applicationId });
    const bothReviewed = allReviews.length >= 2;

    // Update application if both reviewed
    if (bothReviewed) {
      application.status = 'closed';
      await application.save();
    }

    // Notify the other party
    try {
      const io = req.app.get('io');
      const otherUserId = isClient ? application.currentSpecialist : application.user;
      if (io && otherUserId) {
        const userType = isClient ? 'specialist' : 'user';
        io.to(`${userType}_` + String(otherUserId)).emit('review_submitted', { applicationId });
      }
    } catch (e) {}

    res.json({ success: true, data: review, applicationClosed: bothReviewed });
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};