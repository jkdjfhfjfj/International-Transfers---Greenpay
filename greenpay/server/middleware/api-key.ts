import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  scope?: string[];
}

// Demo API keys for testing (available in development)
const DEMO_KEYS: Record<string, { isActive: boolean; scope: string[] }> = {
  'gpay_demo_test': { isActive: true, scope: ['read', 'write', '*'] },
  'gpay_demo_read': { isActive: true, scope: ['read'] },
  'gpay_demo_write': { isActive: true, scope: ['write'] },
  'gpay_demo_all': { isActive: true, scope: ['*'] }
};

export function validateApiKey(requiredScope: string = 'read') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Missing or invalid Authorization header',
          message: 'Include Authorization: Bearer YOUR_API_KEY'
        });
      }

      const key = authHeader.substring(7);
      
      if (!key || !key.startsWith('gpay_')) {
        return res.status(403).json({
          error: 'Invalid API key format',
          message: 'API keys must start with gpay_'
        });
      }

      try {
        // Check demo keys first (development)
        if (key.startsWith('gpay_demo_')) {
          const demoKey = DEMO_KEYS[key];
          if (demoKey && demoKey.isActive) {
            if (requiredScope && !demoKey.scope.includes(requiredScope) && !demoKey.scope.includes('*')) {
              return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This demo key does not have '${requiredScope}' scope`
              });
            }
            req.apiKey = key;
            console.log(`✓ [Demo API Key] Validated: ${key} (scope: ${demoKey.scope.join(', ')})`);
            return next();
          }
        }

        // Check database keys
        const settings = await storage.getSystemSetting('api_keys', key);
        
        if (!settings) {
          return res.status(403).json({
            error: 'Invalid or inactive API key',
            message: 'Check your API key or request a new one'
          });
        }

        const keyData = settings.value as any;

        if (!keyData.isActive) {
          return res.status(403).json({
            error: 'API key has been revoked',
            message: 'This key is no longer active'
          });
        }

        if (requiredScope && !keyData.scope?.includes(requiredScope) && !keyData.scope?.includes('*')) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `This key does not have '${requiredScope}' scope`
          });
        }

        req.apiKey = key;
        next();
      } catch (error) {
        console.error('[API Key] Validation error:', error);
        return res.status(500).json({
          error: 'Authentication failed',
          message: 'Internal server error during authentication'
        });
      }
    } catch (error) {
      console.error('[API Key Middleware] Error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

export async function optionalApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const key = authHeader.substring(7);
      
      if (key && key.startsWith('gpay_')) {
        try {
          // Check demo keys first
          if (key.startsWith('gpay_demo_')) {
            const demoKey = DEMO_KEYS[key];
            if (demoKey && demoKey.isActive) {
              req.apiKey = key;
              console.log(`✓ [Demo API Key] Optional: ${key}`);
              return next();
            }
          }

          // Check database keys
          const settings = await storage.getSystemSetting('api_keys', key);
          if (settings) {
            const keyData = settings.value as any;
            if (keyData.isActive) {
              req.apiKey = key;
            }
          }
        } catch (error) {
          // Silently continue - optional validation
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('[Optional API Key Middleware] Error:', error);
    next();
  }
}
