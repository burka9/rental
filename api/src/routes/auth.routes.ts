import { Router, Request, Response, NextFunction } from 'express';
import { Database } from '../db';
import { ROLES, User } from '../entities/User.entity';
import { compareSync } from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../lib/logger';
import { SessionRepository } from '../controller/user.controller';

const UserRepository = Database.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: number;
  phone: string;
  role: string;
  buildingId: number | null;
}

// Middleware to verify Bearer token
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  console.log('-----------------')
  console.log(req.url)
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const session = await SessionRepository.findOneBy({ token })
    if (!session || session.expiresAt < new Date() || !session.isActive) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    logger.debug(decoded)
    res.locals.user = decoded; // Attach user data to res.locals
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

export type UserFilter = {
  buildingId?: number
}

export function verifyUser(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user
  let buildingId = -1

  switch (user.role) {
    case ROLES.BUILDING_ADMIN:
      buildingId = user.buildingId
      break
    default:
  }

  res.locals.filter = {
    buildingId: buildingId === -1 ? undefined : buildingId
  }

  next()
}

export function isSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user
  if (user.role !== ROLES.SUPERADMIN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next()
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user

  console.log('---------------')
  console.log(user.role === ROLES.ADMIN)
  console.log(user.role === ROLES.SUPERADMIN)
  
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPERADMIN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next()
}

export default function (): Router {
  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    const { phone, password }: { phone: string; password: string } = req.body;

    try {
      // Find user by phone, including building relation
      const user = await UserRepository.findOne({
        where: { phone },
        relations: ['building'],
      });

      // Validate credentials
      if (!user || !user.password || !compareSync(password, user.password)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const expireDate = {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        expiresIn: '1d' as const
      }

      // Create JWT
      const token = jwt.sign(
        {
          userId: user.id,
          phone: user.phone,
          role: user.role,
          buildingId: user.buildingId || null,
        },
        JWT_SECRET,
        { expiresIn: expireDate.expiresIn }
      );

      const session = await SessionRepository.save({
        userId: user.id,
        expiresAt: expireDate.expiresAt,
        token,
        isActive: true,
      })

      // Respond with user details and token
      res.status(200).json({
        message: 'Login successful',
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          buildingId: user.buildingId || null,
        },
        token,
        redirect: '/dashboard/home',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/verify', verifyToken, async (req: Request, res: Response) => {
    try {
      const user = await UserRepository.findOne({
        where: { id: res.locals.user.userId },
        relations: ['building'],
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          buildingId: user.buildingId || null,
        },
      });
    } catch (error) {
      console.error('Verify error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}