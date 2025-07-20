import {Request} from 'express';


declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string; // or any other user properties you want to include
                username: string;
            };
        }
    }
}