import { AuthPayload } from './src/middleware/auth';

declare global {
  namespace Express {
    interface User extends AuthPayload {}
  }
}
