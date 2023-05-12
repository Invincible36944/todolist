//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:admin@cluster0.mcwyiuf.mongodb.net/");

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to ur to do list.",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const defaultItem = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItem)
          .then(function () {
            console.log("Successfully saved defult items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:custonListName", async function (req, res) {
  const custoListName = _.capitalize(req.params.custonListName);

  List.findOne({ name: custoListName })
    .then(async (foundList) => {
      if (!foundList) {
        const list = new List({
          name: custoListName,
          items: defaultItem,
        });
        await list.save();
        res.redirect("/" + custoListName);
      } else {
        console.log(custoListName + " Already exits");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then(async (foundList) => {
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    if (checkedItemId != undefined) {
      await Item.findByIdAndRemove(checkedItemId)
        .then(() => console.log(`Deleted ${checkedItemId} Successfully`))
        .catch((err) => console.log("Deletion Error: " + err));
      res.redirect("/");
    }
  }
  else
  {
    List.findOneAndUpdate( 
      {name: listName}, 
      {$pull: {items: {_id: checkedItemId}}}
      )
      .then(async (foundlist) =>{
        res.redirect("/" + listName);
      })
  }

  
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
