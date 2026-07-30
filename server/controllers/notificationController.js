const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const prefService = require('../services/notificationPreferenceService');
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications
 * Get paginated notifications for the current user.
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { search, type, isRead, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (isRead === 'true') where.isRead = true;
    else if (isRead === 'false') where.isRead = false;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({ where, orderBy, skip, take: pageSize }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.json({
      success: true,
      data: notifications,
      pagination: { page, pageSize, total, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
    });
  } catch (error) { next(error); }
};

/**
 * GET /api/notifications/unread
 * Get unread count and recent unread notifications.
 */
exports.getUnread = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    const recent = await prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    res.json({ success: true, data: { count, recent } });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markRead = async (req, res, next) => {
  try {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) return next(new AppError('Notification not found', 404));
    if (n.userId !== req.user.id) return next(new AppError('Not authorized', 403));

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user.
 */
exports.markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!n) return next(new AppError('Notification not found', 404));
    if (n.userId !== req.user.id) return next(new AppError('Not authorized', 403));

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
};

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user.
 */
exports.getPreferences = async (req, res, next) => {
  try {
    const prefs = await prefService.getPreferences(req.user.id);
    res.json({ success: true, data: prefs });
  } catch (error) { next(error); }
};

/**
 * PUT /api/notifications/preferences
 * Update notification preferences for the current user.
 */
exports.updatePreferences = async (req, res, next) => {
  try {
    const allowed = ['emailEnabled','smsEnabled','inAppEnabled','bookingNotifications','paymentNotifications','reviewNotifications','marketingEmails'];
    const data = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) data[f] = req.body[f]; });
    const prefs = await prefService.updatePreferences(req.user.id, data);
    res.json({ success: true, message: 'Preferences updated', data: prefs });
  } catch (error) { next(error); }
};

/**
 * POST /api/admin/notifications/send
 * Admin: Send system-wide notification.
 */
exports.adminSendNotification = async (req, res, next) => {
  try {
    const { title, message, target, type } = req.body;
    if (!title || !message) return next(new AppError('Title and message are required', 400));

    let where = {};
    if (target === 'owners') where.role = 'OWNER';
    else if (target === 'renters') where.role = 'RENTER';
    else if (target === 'verified') where.isVerified = true;
    // 'everyone' = no filter

    const users = await prisma.user.findMany({ where, select: { id: true } });

    const params = users.map(u => ({
      userId: u.id,
      type: type || 'SYSTEM',
      title,
      message,
      channels: ['IN_APP'],
      context: { message },
    }));

    await notificationService.createBulkNotifications(params);

    res.json({ success: true, message: 'Notification sent to ' + users.length + ' users' });
  } catch (error) { next(error); }
};
