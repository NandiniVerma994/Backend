import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    //video is publicly available to users or not
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, {timestamps: true})

// Pagination = breaking big data into smaller pages.
// How does it work in MongoDB?
// We use two methods:
// .skip():
// ➔ Skips the earlier items.
// .limit():
// ➔ Limits how many items you get.
// ou have 50 videos.
// You want to show 10 videos per page.
// Total pages: 50 / 10 = 5 pages.
// When a user clicks:
// Page 1: they see videos 1–10.
// Page 2: they see videos 11–20.
// Page 3: they see videos 21–30.

// .plugin(...) = Mongoose’s way of adding extra features (kind of like “power-ups” for your schema).
// mongooseAggregatePaginate = a plugin that helps you do pagination on aggregate queries.

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)