import { IUser } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// This export makes it a module
export {};
