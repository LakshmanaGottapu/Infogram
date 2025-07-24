import {Request} from 'express';

declare global {
    namespace Express {
        interface User{
            id: string;
            username: string;
        }
        interface Request {
            user?: User;
        }
    }
}