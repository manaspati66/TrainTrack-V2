import type { RequestHandler } from "express";
import { storage } from "./storage";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

// Helper to get user from database with full details
async function getUserFromRequest(req: any) {
  const userId = req.user?.claims?.sub;
  if (!userId) return null;
  
  const user = await storage.getUser(userId);
  return user;
}

// Middleware: Require specific role(s)
export function requireRole(...allowedRoles: string[]): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = await getUserFromRequest(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'unauthorized', 
          reason: 'user_not_found' 
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'forbidden', 
          reason: 'role_or_scope' 
        });
      }

      // Attach user to request for use in handlers
      (req as any).dbUser = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        error: 'internal_error', 
        reason: 'role_check_failed' 
      });
    }
  };
}

// Middleware: Require manager of target employee
export function requireManagerOfEmployee(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = await getUserFromRequest(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'unauthorized', 
          reason: 'user_not_found' 
        });
      }

      // Only managers can use this middleware
      if (user.role !== 'manager') {
        return res.status(403).json({ 
          error: 'forbidden', 
          reason: 'role_or_scope' 
        });
      }

      // Get target employee ID from params or body
      const targetEmployeeId = req.params.employeeId || 
                               req.body.employeeId || 
                               req.body.forEmployeeId;

      if (!targetEmployeeId) {
        return res.status(400).json({ 
          error: 'bad_request', 
          reason: 'employee_id_required' 
        });
      }

      // Check if target employee reports to this manager
      const targetEmployee = await storage.getUser(targetEmployeeId);
      
      if (!targetEmployee) {
        return res.status(404).json({ 
          error: 'not_found', 
          reason: 'employee_not_found' 
        });
      }

      if (targetEmployee.managerId !== user.id) {
        return res.status(403).json({ 
          error: 'forbidden', 
          reason: 'role_or_scope' 
        });
      }

      // Attach user and target employee to request
      (req as any).dbUser = user;
      (req as any).targetEmployee = targetEmployee;
      next();
    } catch (error) {
      console.error('Manager check error:', error);
      return res.status(500).json({ 
        error: 'internal_error', 
        reason: 'manager_check_failed' 
      });
    }
  };
}

// Middleware: Scope query to department (for managers)
export function scopedToDept(): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = await getUserFromRequest(req);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'unauthorized', 
          reason: 'user_not_found' 
        });
      }

      // Attach user and department scope to request
      (req as any).dbUser = user;
      
      if (user.role === 'manager') {
        (req as any).departmentScope = user.department;
      }
      
      next();
    } catch (error) {
      console.error('Department scope error:', error);
      return res.status(500).json({ 
        error: 'internal_error', 
        reason: 'scope_check_failed' 
      });
    }
  };
}

// Helper: Check if user can manage training need (for manager pre-approval)
export async function canManagerApproveNeed(managerId: string, needId: number): Promise<boolean> {
  try {
    const manager = await storage.getUser(managerId);
    if (!manager || manager.role !== 'manager') {
      return false;
    }

    const need = await storage.getTrainingNeedById(needId);
    if (!need) {
      return false;
    }

    const targetEmployee = await storage.getUser(need.forEmployeeId!);
    if (!targetEmployee) {
      return false;
    }

    // Manager can approve if employee reports to them
    return targetEmployee.managerId === managerId;
  } catch (error) {
    console.error('Manager approval check error:', error);
    return false;
  }
}
