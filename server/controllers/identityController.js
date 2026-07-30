const prisma = require('../utils/prisma');
const stripe = require('../utils/stripe');
const { AppError } = require('../middleware/errorMiddleware');

/**
 * Identity Verification Controller
 *
 * Uses Stripe Identity to verify user identity.
 * Only stores Stripe session/report IDs — never stores actual identity documents.
 */

const HIGH_VALUE_DEPOSIT = 500; // $500 security deposit threshold
const HIGH_VALUE_RATE = 200;    // $200 daily rate threshold

/**
 * Check if a listing requires mandatory identity verification.
 */
const isHighValue = (listing) => {
  return listing.securityDeposit >= HIGH_VALUE_DEPOSIT || listing.dailyRate >= HIGH_VALUE_RATE;
};

/**
 * POST /api/identity/create-session
 * Create a Stripe Identity verification session for the current user.
 */
exports.createSession = async (req, res, next) => {
  try {
    if (!stripe) return next(new AppError('Stripe is not configured', 500));

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, fullName: true, email: true },
    });
    if (!user) return next(new AppError('User not found', 404));

    // Check for existing valid verification
    const existing = await prisma.identityVerification.findFirst({
      where: { userId: user.id, status: 'VERIFIED' },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) {
      return res.json({ success: true, message: 'Already verified', data: { status: 'VERIFIED', verification: existing } });
    }

    // Create Stripe Identity verification session
    const session = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: { userId: user.id },
      required_verification: ['document', 'selfie'],
      options: {
        document: {
          allowed_types: ['driving_license', 'passport', 'id_card'],
          require_id_number: true,
          require_live_capture: true,
        },
      },
      return_url: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/profile?verification=complete',
    });

    // Store verification session
    const verification = await prisma.identityVerification.create({
      data: {
        userId: user.id,
        verificationSessionId: session.id,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: session.client_secret,
        sessionId: session.id,
        verificationId: verification.id,
        url: session.url,
      },
    });
  } catch (error) {
    if (error.type?.startsWith('Stripe')) {
      return next(new AppError('Stripe Identity error: ' + error.message, 400));
    }
    next(error);
  }
};

/**
 * GET /api/identity/status
 * Get the current user's identity verification status.
 */
exports.getStatus = async (req, res, next) => {
  try {
    const verification = await prisma.identityVerification.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.json({ success: true, data: { status: null, verified: false } });
    }

    res.json({
      success: true,
      data: {
        status: verification.status,
        verified: verification.status === 'VERIFIED',
        verifiedAt: verification.verifiedAt,
        documentType: verification.documentType,
        verificationId: verification.id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/identity/check-listing/:listingId
 * Check if identity verification is required/mandatory for a listing.
 */
exports.checkListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.listingId } });
    if (!listing) return next(new AppError('Listing not found', 404));

    const required = isHighValue(listing);

    // If verification exists and is verified, user is good
    let verified = false;
    if (req.user) {
      const v = await prisma.identityVerification.findFirst({
        where: { userId: req.user.id, status: 'VERIFIED' },
        orderBy: { createdAt: 'desc' },
      });
      verified = !!v;
    }

    res.json({
      success: true,
      data: {
        required,
        verified,
        needsVerification: required && !verified,
        thresholds: { securityDeposit: HIGH_VALUE_DEPOSIT, dailyRate: HIGH_VALUE_RATE },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/identity/webhook
 * Stripe Identity webhook — receives verification events.
 * Requires raw body for signature verification.
 */
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ success: false, message: 'No signature' });

  let event;
  try {
    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && stripe) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Fallback: parse without verification (for development)
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('[Identity Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  try {
    const session = event.data.object;

    if (event.type === 'identity.verification_session.verified') {
      const verification = await prisma.identityVerification.findFirst({
        where: { verificationSessionId: session.id },
      });

      if (verification) {
        await prisma.identityVerification.update({
          where: { id: verification.id },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verificationReportId: session.latest_report || null,
            // Extract document type from verified_outputs (success) or last_setup_error (failure)
            documentType: session.verified_outputs?.document?.type || session.last_setup_error?.type || null,
            country: session.verified_outputs?.document?.issuing_country || session.last_setup_error?.country || null,
          },
        });
        console.log('[Identity] User verified:', verification.userId);
      }
    } else if (event.type === 'identity.verification_session.requires_input') {
      await prisma.identityVerification.updateMany({
        where: { verificationSessionId: session.id },
        data: { status: 'FAILED' },
      });
      console.log('[Identity] Verification failed:', session.id);
    } else if (event.type === 'identity.verification_session.processing') {
      await prisma.identityVerification.updateMany({
        where: { verificationSessionId: session.id },
        data: { status: 'PROCESSING' },
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Identity Webhook] Error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook error' });
  }
};

// Export threshold constants for use in other modules
exports.HIGH_VALUE_DEPOSIT = HIGH_VALUE_DEPOSIT;
exports.HIGH_VALUE_RATE = HIGH_VALUE_RATE;
exports.isHighValue = isHighValue;
