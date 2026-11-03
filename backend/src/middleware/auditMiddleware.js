const { DateTime } = require('luxon');
const { GlobalActivityLog } = require('../models');
const logger = require('../config/logger');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

// Map request methods & routes to explicit activity log actions
function mapAction(req) {
  const path = req.originalUrl || req.url;
  const method = req.method;

  if (path.includes('/entries/batch-save')) return 'ENTRY_AUTO_SAVE_UPDATE';
  if (path.includes('/share') && method === 'POST') return 'SHARE_GRANT';
  if (path.includes('/share') && method === 'DELETE') return 'SHARE_REVOKE';
  if (path.includes('/unlock') && method === 'POST') return 'MONTH_UNLOCK_GRANT';
  if (path.includes('/export-pdf')) return 'PDF_REPORT_EXPORT';
  if (path.includes('/files/upload')) return 'FILE_UPLOAD';
  if (path.includes('/schema') && method === 'PATCH') return 'SCHEMA_COLUMN_ADD';
  if (path.includes('/sheets') && method === 'POST') return 'SHEET_CREATE';
  if (path.includes('/sheets') && method === 'DELETE') return 'SHEET_DELETE';
  if (method === 'POST') return 'ENTRY_CREATE';
  if (method === 'PUT' || method === 'PATCH') return 'ENTRY_AUTO_SAVE_UPDATE';
  if (method === 'DELETE') return 'ENTRY_DELETE';

  return null;
}

const auditMiddleware = (req, res, next) => {
  // Only audit state-modifying requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (body) {
    res.json = originalJson;
    originalJson.call(this, body);

    // If request succeeded and user is authenticated, record activity
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
      setImmediate(async () => {
        try {
          const action = mapAction(req);
          if (!action) return;

          const now = DateTime.now().setZone(TIMEZONE);
          await GlobalActivityLog.create({
            timestamp: now.toJSDate(),
            timestampIST: now.toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
            actor: {
              userId: req.user.id,
              email: req.user.email,
              displayName: req.user.displayName,
              role: req.user.role
            },
            action: action,
            target: {
              sheetKey: req.params.sheetKey || req.body.sheetKey,
              sheetId: req.params.sheetId || req.body.sheetId,
              monthId: req.params.monthId || req.body.monthId,
              entryId: req.params.id || req.body.entryId
            },
            diff: {
              payload: req.body
            },
            metadata: {
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
              requestId: req.headers['x-request-id'] || req.headers['x-idempotency-key']
            }
          });
        } catch (err) {
          logger.warn({ err }, 'Failed to record GlobalActivityLog entry');
        }
      });
    }
  };

  next();
};

module.exports = auditMiddleware;
