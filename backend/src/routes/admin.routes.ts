import { Router } from 'express';
import {
  getAdminOverview,
  listClients,
  createClient,
  updateClient,
  getClientProfile,
  listEditors,
  createEditor,
  updateEditor,
  getEditorProfile,
  getAuditLogs,
} from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/overview', asyncHandler(getAdminOverview));

// Clients
router.get('/clients', asyncHandler(listClients));
router.post('/clients', asyncHandler(createClient));
router.get('/clients/:id', asyncHandler(getClientProfile));
router.put('/clients/:id', asyncHandler(updateClient));

// Editors
router.get('/editors', asyncHandler(listEditors));
router.post('/editors', asyncHandler(createEditor));
router.get('/editors/:id', asyncHandler(getEditorProfile));
router.put('/editors/:id', asyncHandler(updateEditor));

// Audit logs
router.get('/audit-logs', asyncHandler(getAuditLogs));

export default router;
