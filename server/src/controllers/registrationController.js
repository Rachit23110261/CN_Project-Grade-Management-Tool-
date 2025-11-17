import PendingRegistration from "../models/PendingRegistration.js";
import User from "../models/userModel.js";
import { sendRegistrationRequestEmail, sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } from "../services/emailService.js";

// @desc Submit a new registration request
// @route POST /api/registration/request
// @access Public
export const submitRegistrationRequest = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    if (!['student', 'professor'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'student' or 'professor'" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Check if pending registration already exists
    const existingRequest = await PendingRegistration.findOne({ email });
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ 
          message: "A registration request with this email is already pending approval" 
        });
      } else if (existingRequest.status === 'rejected') {
        return res.status(400).json({ 
          message: `Your previous registration request was rejected. Reason: ${existingRequest.rejection_reason || 'Not specified'}` 
        });
      }
    }

    // Create pending registration
    const registration = await PendingRegistration.create({ name, email, password, role });

    // Send email notification to user
    try {
      await sendRegistrationRequestEmail(email, name);
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      message: "Registration request submitted successfully. Please wait for admin approval.",
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        role: registration.role,
        status: registration.status,
        requested_at: registration.requested_at
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get all pending registration requests
// @route GET /api/registration/pending
// @access Private (Admin only)
export const getPendingRegistrations = async (req, res, next) => {
  try {
    const { status, role } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;

    const registrations = await PendingRegistration.find(filter);

    // Remove password from response
    const sanitizedRegistrations = registrations.map(reg => {
      const { password, ...rest } = reg;
      return rest;
    });

    res.json({
      registrations: sanitizedRegistrations,
      count: sanitizedRegistrations.length
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get registration statistics
// @route GET /api/registration/stats
// @access Private (Admin only)
export const getRegistrationStats = async (req, res, next) => {
  try {
    const pending = await PendingRegistration.countByStatus('pending');
    const approved = await PendingRegistration.countByStatus('approved');
    const rejected = await PendingRegistration.countByStatus('rejected');

    res.json({
      pending,
      approved,
      rejected,
      total: pending + approved + rejected
    });
  } catch (err) {
    next(err);
  }
};

// @desc Approve a registration request
// @route PUT /api/registration/approve/:id
// @access Private (Admin only)
export const approveRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Find pending registration
    const registration = await PendingRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ 
        message: `This registration has already been ${registration.status}` 
      });
    }

    // Check if user already exists (in case they were created by another admin)
    const existingUser = await User.findOne({ email: registration.email });
    if (existingUser) {
      // Update status to approved but don't create duplicate user
      await PendingRegistration.updateStatus(id, 'approved', adminId);
      return res.status(400).json({ 
        message: "User already exists in the system" 
      });
    }

    // Create the user account
    const newUser = await User.create({
      name: registration.name,
      email: registration.email,
      password: registration.password, // Already hashed in PendingRegistration
      role: registration.role,
      isPasswordHashed: true // Don't hash again
    });

    // Update registration status
    await PendingRegistration.updateStatus(id, 'approved', adminId);

    // Send approval email to user
    try {
      await sendRegistrationApprovedEmail(registration.email, registration.name);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    res.json({
      message: "Registration approved successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Reject a registration request
// @route PUT /api/registration/reject/:id
// @access Private (Admin only)
export const rejectRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: "Please provide a reason for rejection" });
    }

    // Find pending registration
    const registration = await PendingRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({ 
        message: `This registration has already been ${registration.status}` 
      });
    }

    // Update registration status
    await PendingRegistration.updateStatus(id, 'rejected', adminId, reason);

    // Send rejection email to user
    try {
      await sendRegistrationRejectedEmail(registration.email, registration.name, reason);
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    res.json({
      message: "Registration rejected successfully",
      registration: {
        id: registration.id,
        email: registration.email,
        status: 'rejected',
        reason
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc Delete a registration request
// @route DELETE /api/registration/:id
// @access Private (Admin only)
export const deleteRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    const registration = await PendingRegistration.deleteById(id);
    if (!registration) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    res.json({
      message: "Registration request deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};
