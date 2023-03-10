const mongoose = require("mongoose");
const mypayoutSchema = new mongoose.Schema({
  payoutAmount: Number,
  payoutCategory: String,
  payoutpercentage: Number,
  afterpercentage: Number,
  payoutFrom: String,
  payoutTo: String,
  payoutDate: Date,
  payoutprofit: Number,
  comment: String,
});

const mypayinSchema = new mongoose.Schema({
  payinCategory: String,
  senderName: String,
  recieverName: String,
  place: String,
  payinAmount: Number,
  payinDate: Date,
  payinpercentage: Number,
  afterpercentage: Number,
  payout: Number,
  profit: Number,
  comment: String,
});
const financierSchema = new mongoose.Schema(
  {
    userId: String,
    senderName: String,
    recievedBy: String,
    currentdate: Date,
    mypayin: [mypayinSchema],
    mypayout: [mypayoutSchema],
    createdAt: { type: Date, default: Date.now },
  },
  {
    strictQuery: true,
  }
);

module.exports=mongoose.model('financierrecords',financierSchema)
