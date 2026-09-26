import { Router } from 'express';
import * as controller from './auth.controller.js';
import { requireAuthentication } from './auth.middleware.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/verify-email', controller.verifyEmail);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.get('/me', requireAuthentication, controller.me);

export default router;
