const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');
const { sendAvailabilityAlerts } = require('../services/availabilityAlertService');

const VALID_CATEGORIES = ['electronics', 'tools', 'photography', 'sports', 'camping', 'gaming', 'musical', 'home-appliances', 'party-equipment', 'construction-equipment', 'other'];
const VALID_CONDITIONS = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

exports.createListing = async (req, res, next) => {
  try {
    const { title, description, category, condition, dailyRate, securityDeposit, location, imageUrls, isAvailable } = req.body;

    if (!title || title.trim().length < 5) return next(new AppError('Title must be at least 5 characters', 400));
    if (!description || description.trim().length < 20) return next(new AppError('Description must be at least 20 characters', 400));
    if (!category || !VALID_CATEGORIES.includes(category)) return next(new AppError('Please select a valid category', 400));
    if (!condition || !VALID_CONDITIONS.includes(condition)) return next(new AppError('Please select a valid condition', 400));

    const rate = Number(dailyRate);
    if (!rate || rate <= 0) return next(new AppError('Daily rate must be greater than 0', 400));

    const deposit = Number(securityDeposit) || 0;
    if (deposit < 0) return next(new AppError('Security deposit cannot be negative', 400));
    if (!location || !location.trim()) return next(new AppError('Location is required', 400));

    const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
    if (urls.length === 0) return next(new AppError('At least one image URL is required', 400));

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(), description: description.trim(), category, condition,
        dailyRate: rate, securityDeposit: deposit, location: location.trim(),
        imageUrls: urls, isAvailable: isAvailable !== false,
        ownerId: req.user.id,
      },
      include: { owner: { select: { id: true, fullName: true, profileImage: true, location: true } } },
    });

    res.status(201).json({ success: true, message: 'Listing created successfully', data: listing });
  } catch (error) { next(error); }
};

exports.getListings = async (req, res, next) => {
  try {
    const { search, category, condition, minPrice, maxPrice, available, sort, page, limit } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (available === 'true') where.isAvailable = true;
    if (minPrice || maxPrice) {
      where.dailyRate = {};
      if (minPrice) where.dailyRate.gte = Number(minPrice);
      if (maxPrice) where.dailyRate.lte = Number(maxPrice);
    }

    let orderBy = { createdAt: 'desc' };
    switch (sort) {
      case 'price-low': orderBy = { dailyRate: 'asc' }; break;
      case 'price-high': orderBy = { dailyRate: 'desc' }; break;
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'title': orderBy = { title: 'asc' }; break;
    }

    const take = Math.min(Number(limit) || 12, 50);
    const skip = ((Number(page) || 1) - 1) * take;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where, orderBy, skip, take,
        include: { owner: { select: { id: true, fullName: true, profileImage: true, location: true } } },
      }),
      prisma.listing.count({ where }),
    ]);

    res.status(200).json({ success: true, count: listings.length, total, totalPages: Math.ceil(total / take), currentPage: Number(page) || 1, data: listings });
  } catch (error) { next(error); }
};

exports.getListingById = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true, profileImage: true, location: true, isVerified: true, createdAt: true } },
      },
    });
    if (!listing) return next(new AppError('Listing not found', 404));
    res.status(200).json({ success: true, data: listing });
  } catch (error) { next(error); }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return next(new AppError('Listing not found', 404));
    if (listing.ownerId !== req.user.id) return next(new AppError('You can only edit your own listings', 403));

    const { title, description, category, condition, dailyRate, securityDeposit, location, imageUrls, isAvailable } = req.body;
    const updateData = {};

    if (title !== undefined) {
      if (title.trim().length < 5) return next(new AppError('Title must be at least 5 characters', 400));
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      if (description.trim().length < 20) return next(new AppError('Description must be at least 20 characters', 400));
      updateData.description = description.trim();
    }
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) return next(new AppError('Invalid category', 400));
      updateData.category = category;
    }
    if (condition !== undefined) {
      if (!VALID_CONDITIONS.includes(condition)) return next(new AppError('Invalid condition', 400));
      updateData.condition = condition;
    }
    if (dailyRate !== undefined) {
      const rate = Number(dailyRate);
      if (rate <= 0) return next(new AppError('Daily rate must be greater than 0', 400));
      updateData.dailyRate = rate;
    }
    if (securityDeposit !== undefined) {
      const deposit = Number(securityDeposit);
      if (deposit < 0) return next(new AppError('Security deposit cannot be negative', 400));
      updateData.securityDeposit = deposit;
    }
    if (location !== undefined) {
      if (!location.trim()) return next(new AppError('Location is required', 400));
      updateData.location = location.trim();
    }
    if (imageUrls !== undefined) {
      const urls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
      if (urls.length === 0) return next(new AppError('At least one image URL is required', 400));
      updateData.imageUrls = urls;
    }
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: updateData,
      include: { owner: { select: { id: true, fullName: true, profileImage: true, location: true } } },
    });

    // If the listing became available, notify wishlisting users
    if (isAvailable === true && !listing.isAvailable) {
      sendAvailabilityAlerts(updated.id, updated.title).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Listing updated successfully', data: updated });
  } catch (error) { next(error); }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) return next(new AppError('Listing not found', 404));
    if (listing.ownerId !== req.user.id) return next(new AppError('You can only delete your own listings', 403));

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) { next(error); }
};

exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, fullName: true, profileImage: true, location: true } } },
    });
    res.status(200).json({ success: true, count: listings.length, data: listings });
  } catch (error) { next(error); }
};
