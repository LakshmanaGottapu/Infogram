import { CorsOptions } from 'cors';

const corsOptions: CorsOptions = {
  origin: 
    process.env.NODE_ENV === 'production' 
      ? ['https://your-frontend.com'] 
      : ['http://localhost:3000'],
  credentials: true
};

export default corsOptions;