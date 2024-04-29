import mongoose, {Schema} from "mongoose";

const subscriptionSchema =  new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, //The one who is subscribing
        ref: 'User'
    },
    channel: {
        type: Schema.Types.ObjectId, //Channel is also user and  being subscribed by subscriber
        ref: 'User'
    }
})

export const Subscription = mongoose.model('Subscriptions', subscriptionSchema)