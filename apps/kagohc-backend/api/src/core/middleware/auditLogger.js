const AuditLog = require('../../modules/audit/models/AuditLog');

/**
 * Audit Logger Middleware
 * @param {string} action - The action being performed (CREATE, UPDATE, DELETE, etc.)
 * @param {string} resource - The resource type (USER, EMPLOYEE, etc.)
 * @returns {Function} Express middleware
 */
const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    
    let responseBody = null;
    let responseStatusCode = res.statusCode;
    
    // Override res.json
    res.json = function(body) {
      responseBody = body;
      responseStatusCode = res.statusCode;
      return originalJson.call(this, body);
    };
    
    // Override res.send
    res.send = function(body) {
      responseBody = body;
      responseStatusCode = res.statusCode;
      return originalSend.call(this, body);
    };
    
    // Process after request completes
    res.on('finish', async () => {
      try {
        // Skip logging for certain conditions
        if (req.method === 'GET' && !req.params.id && !req.query.audit) {
          return; // Skip bulk GET requests unless specifically requested
        }
        
        const responseTime = Date.now() - startTime;
        
        // Build log entry
        const logEntry = {
          userId: req.user?._id,
          adminId: req.user?._id,
          action,
          resource,
          resourceId: req.params.id || req.query.resourceId,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILED',
          responseTime,
          timestamp: new Date()
        };
        
        // Add changes for write operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          logEntry.changes = {
            after: req.body
          };
          
          // For updates, you might want to fetch the before state
          // This would need to be implemented based on your models
          if (req.method === 'PUT' || req.method === 'PATCH') {
            // You could add before state here if you have access to the model
            // logEntry.changes.before = await Model.findById(req.params.id);
          }
        }
        
        // Add error details for failed requests
        if (res.statusCode >= 400 && responseBody) {
          try {
            const parsed = typeof responseBody === 'string' 
              ? JSON.parse(responseBody) 
              : responseBody;
            logEntry.errorMessage = parsed.message || parsed.error || JSON.stringify(parsed);
          } catch {
            logEntry.errorMessage = responseBody.toString();
          }
        }
        
        // Save to database (don't await - fire and forget)
        AuditLog.create(logEntry).catch(err => {
          console.error('Failed to save audit log:', err);
        });
        
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });
    
    next();
  };
};

module.exports = auditLogger;
