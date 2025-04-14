import { Router, Request, Response } from 'express';
import { Database } from '../db';
import { User, Session } from '../entities/User.entity';
import { compareSync } from 'bcrypt';

const UserRepository = Database.getRepository(User);
const SessionRepository = Database.getRepository(Session);

export default function (): Router {
  const router = Router();

  router.post('/login', async (req: Request, res: Response) => {
    const { phone, password }: { phone: string; password: string } = req.body;

    try {
      // Find user by phone, including building relation
      const user = await UserRepository.findOne({
        where: { phone },
        relations: ['building'], // Load building if exists
      });

      // Validate credentials
      if (!user || !user.password || !compareSync(password, user.password)) {
        res.status(401).json({ error: 'Invalid credentials' });
        return
      }

      // Create a session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const session = SessionRepository.create({
        userId: user.id,
        expiresAt,
      });
      await SessionRepository.save(session);

      // Set session ID in a cookie
      res.cookie('sessionId', session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/',
      });

      // Respond with user details
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          buildingId: user.buildingId || null, // Include buildingId if exists
        },
        redirect: '/dashboard',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}