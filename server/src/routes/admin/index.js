import { Router } from 'express';
import { authRouter } from './auth.js';
import { requireAdmin } from './session.js';
import { dashboardRouter } from './dashboard.js';
import { bookingsRouter } from './bookings.js';
import { newsletterAdminRouter } from './newsletter.js';
import { blogAdminRouter } from './blog.js';
import { storiesAdminRouter } from './stories.js';

/**
 * Everything under /api/admin. Login and the email-link endpoints are public;
 * every other route needs a signed-in admin.
 */
export const adminRouter = Router();

adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
adminRouter.use('/auth', authRouter);

adminRouter.use(requireAdmin);
adminRouter.use('/dashboard', dashboardRouter);
adminRouter.use('/bookings', bookingsRouter);
adminRouter.use('/newsletter', newsletterAdminRouter);
adminRouter.use('/blog', blogAdminRouter);
adminRouter.use('/stories', storiesAdminRouter);
