const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const { generateToken, sanitizeUser, isValidEmail, isValidPassword } = require('../utils/helpers');

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword, phone, role } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return next(new AppError('Please provide fullName, email, password, and confirmPassword', 400));
    }
    if (!fullName.trim()) return next(new AppError('Full name is required', 400));
    if (!isValidEmail(email)) return next(new AppError('Please provide a valid email address', 400));
    if (!isValidPassword(password)) return next(new AppError('Password must be at least 8 characters with one uppercase, one lowercase, and one number', 400));
    if (password !== confirmPassword) return next(new AppError('Passwords do not match', 400));

    const userRole = role === 'OWNER' ? 'OWNER' : 'RENTER';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new AppError('An account with this email already exists', 409));

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { fullName: fullName.trim(), email: email.toLowerCase(), password: hashedPassword, phone: phone || null, role: userRole },
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return next(new AppError('Please provide email and password', 400));

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return next(new AppError('Invalid email or password', 401));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AppError('Invalid email or password', 401));

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    console.error('GetMe error:', error);
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, bio, location, profileImage } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Profile updated successfully', user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    next(error);
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};
