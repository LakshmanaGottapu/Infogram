import { Schema, model, Document } from 'mongoose';

interface IHealth extends Document {
  health: string;
}

const HealthSchema = new Schema<IHealth>({
  health: { type: String, required: true },
});

const Health = model<IHealth>('Health', HealthSchema);

export default Health;
