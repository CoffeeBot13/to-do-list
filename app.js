//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
_ = require("lodash");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = new mongoose.model("item", itemsSchema);

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = new mongoose.model("list", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (items) {
      res.render("list", { listName: "Today", items: items });
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newActivity;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    newItem.save();

    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(newItem);
        foundList.save();

        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.post("/delete", async function (req, res) {
  const idToDelete = req.body.checkbox;
  const listName = req.body.list;

  if (listName === "Today") {
    await Item.deleteOne({ _id: idToDelete });

    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      {
        $pull: { items: { _id: idToDelete } },
      }
    );

    res.redirect("/" + listName);
  }
});

app.get("/:route", function (req, res) {
  const listName = _.capitalize(req.params.route);

  List.findOne({ name: listName }).then(function (listInDB) {
    if (!listInDB) {
      const list = new List({
        name: listName,
        items: [],
      });

      list.save();

      res.redirect("/" + listName);
    } else {
      //display existing data
      res.render("list", { listName: listName, items: listInDB.items });
    }
  });
});

app.listen(3000, function () {
  console.log("server started on port 3000.");
});
