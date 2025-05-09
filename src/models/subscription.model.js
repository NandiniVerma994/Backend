import mongoose, {Schema} from "mongoose";
// kisi v channels ke subscriber count krni h toh unn documents ko count krenge jisme 
// channel chai aur code hoga
// aapne kis channels ko subscribe kr rkha h toh subscriber ki value c ko count kro
// ab usme se channel ki list nikal ke lao
const subscriptionSchema = new Schema({
    subscriber: {
        //one who is subscribing
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        //one to whom subscriber is subscribing
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)