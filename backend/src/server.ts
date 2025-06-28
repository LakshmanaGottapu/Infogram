import app from './app.js';
import connectDB from './config/db.js';

connectDB(); // Initialize DBconst port = process.env.PORT ?? 8080;

app.listen(process.env.PORT, () => console.log(`listening to http://localhost:${process.env.PORT}`));

export { app };