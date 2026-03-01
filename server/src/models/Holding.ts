import mongoose, { Document, Schema } from 'mongoose';

export interface IHolding extends Document {
    ticker: string;
    qty: number;
    avgCost: number;
    purchaseDate: Date;
    owner: string;
    lastPrice?: number;
    previousClose?: number;
    name?: string;
}

const HoldingSchema: Schema = new Schema({
    ticker: { type: String, required: true, uppercase: true },
    qty: { type: Number, required: true, min: 1 },
    avgCost: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, required: true, default: Date.now },
    owner: { type: String, required: true, default: 'Default User' },
    lastPrice: { type: Number },
    previousClose: { type: Number },
    name: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IHolding>('Holding', HoldingSchema);
