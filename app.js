const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://sidhant:test123@cluster0.kjduwfh.mongodb.net/todolistDB", { useNewUrlParser: true }, (err) => {
	if (err) {
		console.log(err);
	} else {
		console.log("Succesfully Connected MongoDB");
	}
});

const itemSchema = {
	name: String,
};
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
	name: "Buy Food",
});
const item2 = new Item({
	name: "Cook Food",
});
const item3 = new Item({
	name: "Eat Food",
});

const listSchema = {
	name: String,
	items: [itemSchema],
};
const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
	Item.find({}, function (err, foundItems) {
		if (foundItems.length == 0) {
			Item.insertMany([item1, item2, item3], function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Succesfully added default entry");
				}
			});
			res.redirect("/");
		} else {
			res.render("list", { listTitle: "Today", newListItems: foundItems });
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName == "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({ name: listName }, function (err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}
});

app.post("/delete", function (req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName == "Today") {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log("Deleted checked item Succesfully");
			}
		});
		res.redirect("/");
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, foundList) {
			if (!err) {
				res.redirect("/" + listName);
			}
		});
	}
});

app.get("/:customListName", function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function (err, foundList) {
		if (!err) {
			if (!foundList) {
				const list = new List({
					name: customListName,
					items: defaultItems,
				});
				list.save();
				res.redirect("/" + customListName);
			} else {
				res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
			}
		}
	});
});

app.get("/about", function (req, res) {
	res.render("about");
});

app.listen(process.env.PORT || 3000, function () {
	console.log("server running at 3000");
});
