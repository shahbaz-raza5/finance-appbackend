require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const AddRecord = require("./db/AddRecord");
const AddFinancier = require("./db/AddFinancier");
const app = express();
const pdf = require("html-pdf");
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

//////////SUGNUP////////////////
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      res.send("user already exists");
    } else {
      user = new User({
        name,
        email,
        password,
      });
      res.send(user);
      await user.save();
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//////////LOGIN////////////////
app.post("/login", async (req, resp) => {
  let user = await User.findOne(req.body);
  if (user) {
    resp.send(user);
  } else {
    resp.send({ result: "No User" });
  }
});

app.post("/add-record", async (req, resp) => {
  let records = new AddRecord(req.body);
  let result = await records.save();
  resp.send(result);
});

app.get("/records/:userId", async (req, resp) => {
  const userId = req.params.userId;
  let records = await AddRecord.find({ userId: userId }).sort({
    createdAt: -1,
  });
  if (records.length > 0) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found " });
  }
});

app.delete("/record/:id", async (req, resp) => {
  try {
    const result = await AddRecord.deleteOne({ _id: req.params.id });
    resp.json(result);
  } catch (err) {
    resp.json({ message: err });
  }
});
app.get("/recordpayin/:id", async (req, resp) => {
  const { id } = req.params;
  const result = await AddRecord.findById(id).populate({
    path: "mypayin",
    match: { _id: id },
  });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/recordpayout/:id", async (req, resp) => {
  const { id } = req.params;
  const result = await AddRecord.findById(id).populate({
    path: "mypayout",
    match: { _id: id },
  });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/customerrecordget/:id", async (req, resp) => {
  const result = await AddRecord.findById({ _id: req.params.id }).sort({
    createdAt: -1,
  });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/financierrecordget/:id", async (req, resp) => {
  const result = await AddFinancier.findById({ _id: req.params.id }).sort({
    createdAt: -1,
  });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/record/:id", async (req, resp) => {
  const result = await AddRecord.findById({ _id: req.params.id }).sort({
    createdAt: -1,
  });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.put("/record/:id", async (req, resp) => {
  let result = await AddRecord.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

/////////////////////// SEARCH CUSTOMER RECORD BY NAME////////////////////////////
app.get("/customername/:name", async (req, resp) => {
  const { sname } = req.params.name;
  const lowerCaseName = req.params.name.toLowerCase();
  let records = await AddRecord.find({
    senderName: { $regex: new RegExp("^" + lowerCaseName + "$", "i") },
  });
  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

/////////////////////// SEARCH CUSTOMER RECORD BY DATE////////////////////////////

app.get("/customerdate/:date", async (req, resp) => {
  const date = new Date(req.params.date);
  const records = await AddRecord.find({ currentdate: date });
  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

/////////////////////// SEARCH CUSTOMER RECORD BY FILTERDATE////////////////////////////

app.get("/customerfilterdate/:startDate/:endDate", async (req, resp) => {
  const startdate = new Date(req.params.startDate);
  const enddate = new Date(req.params.endDate);

  const records = await AddRecord.find({
    currentdate: { $gte: startdate, $lte: enddate },
  });
  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

/////////////////////CUSTOMER PAYIN  GET API'S//////////////////////////////
////////////////////CUSTOMER PAYIN FILTER DATE API/////////////////

app.get(
  "/customerpayinfilterdate/:isId/:startDate/:endDate",
  async (req, res) => {
    try {
      const { isId, startDate, endDate } = req.params;
      const record = await AddRecord.findById({ _id: isId });
      if (!record) {
        return res.status(404).send("record not found");
      }

      // Filter the mypayin array by payinDate between startDate and endDate
      const filteredPayins = record.mypayin.filter((payin) => {
        const payinDate = new Date(payin.payinDate);
        return (
          payinDate >= new Date(startDate) && payinDate <= new Date(endDate)
        );
      });
      res.json(filteredPayins);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

////////////////////CUSTOMER PAYIN DATE API/////////////////

app.get("/customerpayindate/:objId/:date", async (req, resp) => {
  const { objId, date } = req.params;
  try {
    const record = await AddRecord.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payin = record.mypayin.filter(
      (payin) => payin.payinDate.toISOString().slice(0, 10) === date
    );
    resp.json(payin);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

////////////////////CUSTOMER PAYIN GET NAME API/////////////////

app.get("/customerpayinname/:isId/:name", async (req, resp) => {
  const { isId, name } = req.params;
  try {
    const record = await AddRecord.findById(isId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    // senderName: { $regex: new RegExp("^" + lowerCaseName + "$", "i") },
    const payinname = record.mypayin.filter((payin) =>
      new RegExp(`^${name}`, "i").test(payin.senderName)
    );

    resp.json(payinname);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});
/////////////////////PAYOUT GET API'S//////////////////////////////
////////////////////CUSTOMER PAYOUT FILTER DATE API/////////////////

app.get(
  "/customerpayoutfilterdate/:isId/:startDate/:endDate",
  async (req, res) => {
    try {
      const { isId, startDate, endDate } = req.params;
      const record = await AddRecord.findById({ _id: isId });
      if (!record) {
        return res.status(404).send("record not found");
      }

      // Filter the mypayin array by payinDate between startDate and endDate
      const filteredPayouts = record.mypayout.filter((payout) => {
        const payoutDate = new Date(payout.payoutDate);
        return (
          payoutDate >= new Date(startDate) && payoutDate <= new Date(endDate)
        );
      });
      res.json(filteredPayouts);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

////////////////////CUSTOMER PAYOUT DATE API/////////////////
app.get("/customerpayoutdate/:objId/:date", async (req, resp) => {
  const { objId, date } = req.params;
  try {
    const record = await AddRecord.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payouts = record.mypayout.filter(
      (payout) => payout.payoutDate.toISOString().slice(0, 10) === date
    );
    resp.json(payouts);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

////////////////////CUSTOMER PAYOUT GET BY NAME API/////////////////

app.get("/customerpayoutname/:objId/:name", async (req, resp) => {
  const { objId, name } = req.params;
  try {
    const record = await AddRecord.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payoutname = record.mypayout.filter((payout) =>
      new RegExp(`^${name}`, "i").test(payout.payoutTo)
    );

    resp.json(payoutname);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////******************************************************************************************************** */

/////////////////////FINANCIER PAYIN  GET API'S//////////////////////////////
////////////////////FINANCIER PAYIN FILTER DATE API/////////////////

app.get(
  "/financierpayinfilterdate/:isId/:startDate/:endDate",
  async (req, res) => {
    try {
      const { isId, startDate, endDate } = req.params;
      const record = await AddFinancier.findById({ _id: isId });
      if (!record) {
        return res.status(404).send("record not found");
      }

      // Filter the mypayin array by payinDate between startDate and endDate
      const filteredPayins = record.mypayin.filter((payin) => {
        const payinDate = new Date(payin.payinDate);
        return (
          payinDate >= new Date(startDate) && payinDate <= new Date(endDate)
        );
      });
      res.json(filteredPayins);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

////////////////////FINANCIER PAYIN DATE API/////////////////

app.get("/financierpayindate/:objId/:date", async (req, resp) => {
  const { objId, date } = req.params;
  try {
    const record = await AddFinancier.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payin = record.mypayin.filter(
      (payin) => payin.payinDate.toISOString().slice(0, 10) === date
    );
    resp.json(payin);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

////////////////////FINANCIER PAYIN GET NAME API/////////////////

app.get("/financierpayinname/:isId/:name", async (req, resp) => {
  const { isId, name } = req.params;
  try {
    const record = await AddFinancier.findById(isId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }

    const payinname = record.mypayin.filter((payin) =>
      new RegExp(`^${name}`, "i").test(payin.senderName)
    );
    resp.json(payinname);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});
/////////////////////FINANCIER PAYOUT GET API'S//////////////////////////////
////////////////////FINANCIER PAYOUT FILTER DATE API/////////////////

app.get(
  "/financierpayoutfilterdate/:isId/:startDate/:endDate",
  async (req, res) => {
    try {
      const { isId, startDate, endDate } = req.params;
      const record = await AddFinancier.findById({ _id: isId });
      if (!record) {
        return res.status(404).send("record not found");
      }

      // Filter the mypayin array by payinDate between startDate and endDate
      const filteredPayouts = record.mypayout.filter((payout) => {
        const payoutDate = new Date(payout.payoutDate);
        return (
          payoutDate >= new Date(startDate) && payoutDate <= new Date(endDate)
        );
      });
      res.json(filteredPayouts);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

////////////////////FINANCIER PAYOUT DATE API/////////////////
app.get("/financierpayoutdate/:objId/:date", async (req, resp) => {
  const { objId, date } = req.params;
  try {
    const record = await AddFinancier.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payouts = record.mypayout.filter(
      (payout) => payout.payoutDate.toISOString().slice(0, 10) === date
    );
    resp.json(payouts);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

////////////////////FINANCIER PAYOUT GET BY NAME API/////////////////

app.get("/financierrpayoutname/:objId/:name", async (req, resp) => {
  const { objId, name } = req.params;
  try {
    const record = await AddFinancier.findById(objId).exec();
    if (!record) {
      return resp.status(404).send("Record not found");
    }
    const payoutname = record.mypayout.filter((payout) =>
      new RegExp(`^${name}`, "i").test(payout.payoutTo)
    );

    resp.json(payoutname);
  } catch (err) {
    resp.status(500).send("Server error");
  }
});

//////FINANCIER API'S////////

app.post("/addfinancier", async (req, resp) => {
  let record = new AddFinancier(req.body);
  let result = await record.save();
  resp.send(result);
});

app.delete("/financierdel/:id", async (req, resp) => {
  const result = await AddFinancier.deleteOne({ _id: req.params.id });
  resp.send(result);
});

app.get("/financiername/:name", async (req, resp) => {
  const lowerCaseName = req.params.name.toLowerCase();
  let records = await AddFinancier.find({
    senderName: { $regex: new RegExp("^" + lowerCaseName + "$", "i") },
  });
  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});
app.get("/financierrecords/:userId", async (req, resp) => {
  const userId = req.params.userId;
  let records = await AddFinancier.find({ userId: userId }).sort({
    createdAt: -1,
  });
  if (records.length > 0) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/financierrecord/:id", async (req, resp) => {
  const result = await AddFinancier.findOne({ _id: req.params.id });
  if (result) {
    resp.send(result);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.put("/addfinancier/:id", async (req, resp) => {
  let result = await AddFinancier.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  resp.send(result);
});

app.get("/financierdate/:date", async (req, resp) => {
  const date = new Date(req.params.date);

  const records = await AddFinancier.find({ currentdate: date });

  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

app.get("/financierfilterdate/:startDate/:endDate", async (req, resp) => {
  const startdate = new Date(req.params.startDate);
  const enddate = new Date(req.params.endDate);

  const records = await AddFinancier.find({
    currentdate: { $gte: startdate, $lte: enddate },
  });
  if (records.length >= 1) {
    resp.send(records);
  } else {
    resp.send({ result: "No Records Found" });
  }
});

//////////////////CUSTOMER PAYOUT GET API'S//////////////////////
/////////////////////////////////////////////////////////////////

////////////////////////////////FINANCIER PAYOUT GET API's/////////////////////
///////////////////////////////////////////////////////////////////////////////

app.delete("/customerpayoutdel/:id", async (req, res) => {
  const { id } = req.params;
  const { payoutIndex } = req.body;
  try {
    const record = await AddRecord.findByIdAndUpdate(
      id,
      {
        $pull: { mypayout: { _id: payoutIndex } },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error deleting mypayout", error });
  }
});
app.delete("/customerpayindel/:id", async (req, res) => {
  const { id } = req.params;
  const { payinIndex } = req.body;
  try {
    const record = await AddRecord.findByIdAndUpdate(
      id,
      {
        $pull: { mypayin: { _id: payinIndex } },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error deleting mypayout", error });
  }
});

app.delete("/financierpayindel/:id", async (req, res) => {
  const { id } = req.params;
  const { payinIndex } = req.body;
  try {
    const record = await AddFinancier.findByIdAndUpdate(
      id,
      {
        $pull: { mypayin: { _id: payinIndex } },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error deleting mypayout", error });
  }
});

app.delete("/financierpayoutdel/:id", async (req, res) => {
  const { id } = req.params;
  const { payoutIndex } = req.body;
  try {
    const record = await AddFinancier.findByIdAndUpdate(
      id,
      {
        $pull: { mypayout: { _id: payoutIndex } },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Error deleting mypayout", error });
  }
});

app.post("/addcustomerpayout/:id", async (req, res) => {
  try {
    const payout = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddRecord.findById(id);
    // Create a new payout object
    const newPayout = {
      payoutAmount: payout.payoutAmount,
      payoutCategory: payout.payoutCategory,
      payoutpercentage: payout.payoutPercentage,
      afterpercentage: payout.afterPercentage,
      payoutFrom: payout.payoutFrom,
      payoutTo: payout.payoutTo,
      payoutDate: payout.payoutDate,
      payoutprofit: payout.payoutProfit,
      comment: payout.comments,
    };

    // Add the new payout to the record's mypayout array
    record.mypayout.push(newPayout);

    // Save the record
    await record.save();

    // Send a success response
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//UPDATE ADD PAYIN updatecustomerpayin//
app.put("/updatecustomerpayin/:id", async (req, res) => {
  try {
    const {
      payinAmount,
      payinCategory,
      payinPercentage,
      afterPercentage,
      recieverName,
      senderName,
      payinDate,
      payinProfit,
      comments,
    } = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddRecord.findOneAndUpdate(
      { "mypayin._id": id },
      {
        $set: {
          "mypayin.$.payinAmount": payinAmount,
          "mypayin.$.payinCategory": payinCategory,
          "mypayin.$.payinpercentage": payinPercentage,
          "mypayin.$.afterpercentage": afterPercentage,
          "mypayin.$.recieverName": recieverName,
          "mypayin.$.senderName": senderName,
          "mypayin.$.payinDate": payinDate,
          "mypayin.$.profit": payinProfit,
          "mypayin.$.comment": comments,
        },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//UPDATE ADD PAYIN updateFcierinanpayin//
app.put("/updatefinancierpayin/:id", async (req, res) => {
  try {
    const {
      payinAmount,
      payinCategory,
      payinPercentage,
      afterPercentage,
      recieverName,
      senderName,
      place,
      payinDate,
      payinProfit,
      comments,
    } = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddFinancier.findOneAndUpdate(
      { "mypayin._id": id },
      {
        $set: {
          "mypayin.$.payinAmount": payinAmount,
          "mypayin.$.payinCategory": payinCategory,
          "mypayin.$.payinpercentage": payinPercentage,
          "mypayin.$.afterpercentage": afterPercentage,
          "mypayin.$.recieverName": recieverName,
          "mypayin.$.senderName": senderName,
          "mypayin.$.place": place,
          "mypayin.$.payinDate": payinDate,
          "mypayin.$.profit": payinProfit,
          "mypayin.$.comment": comments,
        },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//UPDATE ADD PAYOUT updatecustomerpayout//
app.put("/updatecustomerpayout/:id", async (req, res) => {
  try {
    const {
      payoutAmount,
      payoutCategory,
      payoutPercentage,
      afterPercentage,
      payoutFrom,
      payoutTo,
      payoutDate,
      payoutProfit,
      comments,
    } = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddRecord.findOneAndUpdate(
      { "mypayout._id": id },
      {
        $set: {
          "mypayout.$.payoutAmount": payoutAmount,
          "mypayout.$.payoutCategory": payoutCategory,
          "mypayout.$.payoutpercentage": payoutPercentage,
          "mypayout.$.afterpercentage": afterPercentage,
          "mypayout.$.payoutFrom": payoutFrom,
          "mypayout.$.payoutTo": payoutTo,
          "mypayout.$.payoutDate": payoutDate,
          "mypayout.$.payoutprofit": payoutProfit,
          "mypayout.$.comment": comments,
        },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//UPDATE ADD PAYOUT updatefinancierpayout//
app.put("/updatefinancierpayout/:id", async (req, res) => {
  try {
    const {
      payoutAmount,
      payoutCategory,
      payoutPercentage,
      afterPercentage,
      payoutFrom,
      payoutTo,
      payoutDate,
      payoutProfit,
      comments,
    } = req.body;
    const { id } = req.params;

    // Find the record by its ID
    const record = await AddFinancier.findOneAndUpdate(
      { "mypayout._id": id },
      {
        $set: {
          "mypayout.$.payoutAmount": payoutAmount,
          "mypayout.$.payoutCategory": payoutCategory,
          "mypayout.$.payoutpercentage": payoutPercentage,
          "mypayout.$.afterpercentage": afterPercentage,
          "mypayout.$.payoutFrom": payoutFrom,
          "mypayout.$.payoutTo": payoutTo,
          "mypayout.$.payoutDate": payoutDate,
          "mypayout.$.payoutprofit": payoutProfit,
          "mypayout.$.comment": comments,
        },
      },
      { new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//GET DATA FOR EDIT customerrecordpayout MYPAYOUT//
app.get("/customerrecordpayout/:id/mypayout/:ind/:itemid", async (req, res) => {
  // const { id, ind } = req.params;
  // const page = parseInt(req.query.currentPage);
  // const pagesize = parseInt(req.query.pageSize);
  // const index = (page - 1) * pagesize + parseInt(ind);

  const { id, ind } = req.params;
  const page = parseInt(req.query.currentPage);
  const pagesize = parseInt(req.query.pageSize);
  const index = (page - 1) * pagesize + parseInt(ind);

  try {
    const record = await AddRecord.findById(id);
    const mypayout = record.mypayout[index];
    res.json(mypayout);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//GET DATA FOR EDIT financierrecordpayout MYPAYOUT//
app.get("/financierrecordpayout/:id/mypayout/:ind/:itemid",async (req, res) => {
    const { id, ind } = req.params;
    const page = parseInt(req.query.currentPage);
    const pagesize = parseInt(req.query.pageSize);
    const index = (page - 1) * pagesize + parseInt(ind);
    try {
      const record = await AddFinancier.findById(id);
      const mypayout = record.mypayout[index];
      res.json(mypayout);
    } catch (error) {
      res.status(500).send("Server error");
    }
  }
);

//GET DATA FOR EDIT CUSTOMER MYPAYIN//
// app.get("/customerrecordpayin/:id/mypayin/:obid", async (req, res) => {
//   const { id, obid } = req.params;
//   try {
//     const record = await AddRecord.findById(id);
//     const mypayin = record.mypayin[obid];
//     res.json(mypayin);
//   } catch (error) {
//     res.status(500).send("Server error");
//   }
// });

app.get("/customerrecordpayin/:id/mypayin/:ind/:itemid", async (req, res) => {
  const { id, ind } = req.params;
  const page = parseInt(req.query.currentPage);
  const pagesize = parseInt(req.query.pageSize);
  const index = (page - 1) * pagesize + parseInt(ind); // Calculate the index of the record

  try {
    const record = await AddRecord.findById(id);
    const mypayin = record.mypayin[index];
    res.json(mypayin);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

//GET DATA FOR EDIT FINANCIER MYPAYIN//
app.get("/financierrecordpayin/:id/mypayin/:ind/:itemid", async (req, res) => {
  const { id, ind } = req.params;
  const page = parseInt(req.query.currentPage);
  const pagesize = parseInt(req.query.pageSize);
  const index = (page - 1) * pagesize + parseInt(ind);
  try {
    const record = await AddFinancier.findById(id);
    const mypayin = record.mypayin[index];
    res.json(mypayin);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

app.post("/addfinancierpayout/:id", async (req, res) => {
  try {
    const payout = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddFinancier.findById(id);
    // Create a new payout object
    const newPayout = {
      payoutAmount: payout.payoutAmount,
      payoutCategory: payout.payoutCategory,
      payoutpercentage: payout.payoutPercentage,
      afterpercentage: payout.afterPercentage,
      payoutFrom: payout.payoutFrom,
      payoutTo: payout.payoutTo,
      payoutDate: payout.payoutDate,
      payoutprofit: payout.payoutProfit,
      comment: payout.comments,
    };

    // Add the new payout to the record's mypayout array
    record.mypayout.push(newPayout);

    // Save the record
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/addcustomerpayin/:id", async (req, res) => {
  try {
    const payin = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddRecord.findById(id);
    // Create a new payout object
    const newPayin = {
      payinAmount: payin.payinAmount,
      payinCategory: payin.payinCategory,
      payinpercentage: payin.payinPercentage,
      afterpercentage: payin.afterPercentage,
      recieverName: payin.recieverName,
      senderName: payin.senderName,
      payinDate: payin.payinDate,
      profit: payin.payinProfit,
      comment: payin.comments,
    };

    // Add the new payout to the record's mypayout array
    record.mypayin.push(newPayin);

    // Save the record
    await record.save();

    // Send a success response
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/addfinancierpayin/:id", async (req, res) => {
  try {
    const payin = req.body;
    const { id } = req.params;
    // Find the record by its ID
    const record = await AddFinancier.findById(id);
    // Create a new payout object
    const newPayin = {
      payinAmount: payin.payinAmount,
      payinCategory: payin.payinCategory,
      payinpercentage: payin.payinPercentage,
      afterpercentage: payin.afterPercentage,
      recieverName: payin.recieverName,
      senderName: payin.senderName,
      place: payin.place,
      payinDate: payin.payinDate,
      profit: payin.payinProfit,
      comment: payin.comments,
    };

    // Add the new payout to the record's mypayout array
    record.mypayin.push(newPayin);

    // Save the record
    await record.save();

    // Send a success response
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/customerrecordfilter/:id/:startDate/:endDate", async (req, res) => {
  const { id, startDate, endDate } = req.params;
  const record = await AddRecord.findById(id);
  const filteredMypayout = record.mypayout.filter(
    (payout) =>
      payout.payoutDate >= new Date(startDate) &&
      payout.payoutDate <= new Date(endDate)
  );
  const filteredMypayin = record.mypayin.filter(
    (payin) =>
      payin.payinDate >= new Date(startDate) &&
      payin.payinDate <= new Date(endDate)
  );
  res.json({ mypayout: filteredMypayout, mypayin: filteredMypayin });
});
app.get("/financierrecordfilter/:id/:startDate/:endDate", async (req, res) => {
  const { id, startDate, endDate } = req.params;
  const record = await AddFinancier.findById(id);
  const filteredMypayout = record.mypayout.filter(
    (payout) =>
      payout.payoutDate >= new Date(startDate) &&
      payout.payoutDate <= new Date(endDate)
  );
  const filteredMypayin = record.mypayin.filter(
    (payin) =>
      payin.payinDate >= new Date(startDate) &&
      payin.payinDate <= new Date(endDate)
  );
  res.json({ mypayout: filteredMypayout, mypayin: filteredMypayin });
});

app.get('*',()=>{
  //send index.html from build folder
})

app.listen(PORT);
