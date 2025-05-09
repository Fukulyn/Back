import { model, Schema } from "mongoose";
import { Pal } from "../../interfaces/Pal";

export const PalSchemas = new Schema<Pal>({
    _id:{ type: String, required: true },
    name:{ type: String, required: true },
    attribute:{ type: String, required: true },
    workCompatibility:{ type: String, required: true },
    image:{ type: String, required: true },
});

export const PalModel = model<Pal>('pal', PalSchemas);
