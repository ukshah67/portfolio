import mongoose, { Document, Schema } from 'mongoose';

export interface IHolding extends Document {
    ticker: string;
    qty: number;
    avgCost: number;
    purchaseDate: Date;
    owner: string;
    // We don't store currentPrice or name in DB as they are fetched live, 
    // but maybe name is good to cache? Let's just store core data.
}

const HoldingSchema: Schema = new Schema({
    ticker: { type: String, required: true, uppercase: true },
    qty: { type: Number, required: true, min: 1 },
    avgCost: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true, default: Date.now },
    owner: { type: String, required: true, default: 'Default User' }
}, {
    timestamps: true
});

export default mongoose.model<IHolding>('Holding', HoldingSchema);
