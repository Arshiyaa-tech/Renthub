const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorMiddleware');

exports.addToWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return next(new AppError('listingId is required', 400));
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return next(new AppError('Listing not found', 404));
    const existing = await prisma.wishlist.findUnique({
      where: { userId_listingId: { userId: req.user.id, listingId } },
    });
    if (existing) return next(new AppError('Already in wishlist', 409));
    const wishlistItem = await prisma.wishlist.create({
      data: { userId: req.user.id, listingId },
      include: { listing: { select: { id: true, title: true, category: true, dailyRate: true, location: true, imageUrls: true, isAvailable: true, condition: true, securityDeposit: true, owner: { select: { id: true, fullName: true, profileImage: true } } } } },
    });
    res.status(201).json({ success: true, message: 'Added to wishlist', data: wishlistItem });
  } catch (error) {
    if (error.code === 'P2002') return next(new AppError('Already in wishlist', 409));
    next(error);
  }
};

exports.getMyWishlist = async (req, res, next) => {
  try {
    const { search, category, available, sort } = req.query;
    const listingWhere = {};
    if (search) listingWhere.OR = [{ title: { contains: search, mode: 'insensitive' } }, { location: { contains: search, mode: 'insensitive' } }];
    if (category) listingWhere.category = category;
    if (available === 'true') listingWhere.isAvailable = true;
    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'price-low') orderBy = { listing: { dailyRate: 'asc' } };
    if (sort === 'price-high') orderBy = { listing: { dailyRate: 'desc' } };
    if (sort === 'title') orderBy = { listing: { title: 'asc' } };
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id, ...(Object.keys(listingWhere).length > 0 ? { listing: listingWhere } : {}) },
      orderBy,
      include: { listing: { select: { id: true, title: true, category: true, dailyRate: true, location: true, imageUrls: true, isAvailable: true, condition: true, securityDeposit: true, createdAt: true, owner: { select: { id: true, fullName: true, profileImage: true } }, reviews: { select: { rating: true } } } } },
    });
    const data = wishlist.map((w) => {
      const reviews = w.listing.reviews || [];
      const avgRating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
      return { ...w, listing: { ...w.listing, reviews: undefined, averageRating: avgRating, reviewCount: reviews.length } };
    });
    res.json({ success: true, count: data.length, data });
  } catch (error) { next(error); }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const existing = await prisma.wishlist.findUnique({ where: { userId_listingId: { userId: req.user.id, listingId } } });
    if (!existing) return next(new AppError('Not in wishlist', 404));
    await prisma.wishlist.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) { next(error); }
};

exports.checkWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const existing = await prisma.wishlist.findUnique({ where: { userId_listingId: { userId: req.user.id, listingId } } });
    res.json({ success: true, data: { isWishlisted: !!existing, wishlistId: existing?.id || null } });
  } catch (error) { next(error); }
};

exports.getWishlistCount = async (req, res, next) => {
  try {
    const count = await prisma.wishlist.count({ where: { userId: req.user.id } });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
};
