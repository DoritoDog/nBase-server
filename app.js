const express = require('express');
const app = express();

require('dotenv').load();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fs   = require('fs');
const jwt = require('jsonwebtoken');
const publicKey  = fs.readFileSync('./public.key', 'utf8');
const privateKey  = fs.readFileSync('./private.key', 'utf8');
const googlePublic = fs.readFileSync('./googlePublic.key', 'utf8');

const crypto = require('crypto');

const ethereum = require('./ethereum.js');

const iap = require('in-app-purchase');
iap.config({
	googlePublicKeyPath: 'googlePublic.key'
});
const goldProducts = [
	{
		productId: '50k_gold',
		amount: 50000
	},
	{
		productId: '100k_gold',
		amount: 100000
	},
	{
		productId: '300k_gold',
		amount: 300000
	},
	{
		productId: '500k_gold',
		amount: 500000
	},
	{
		productId: '1m_gold',
		amount: 1000000
	}
];
const cryptoGoldProducts = [
	{
		productId: '10_ncg',
		amount: 10
	},
	{
		productId: '50_ncg',
		amount: 50
	},
	{
		productId: '100_ncg',
		amount: 100
	},
	{
		productId: '500_ncg',
		amount: 500
	},
	{
		productId: '1k_ncg',
		amount: 1000
	},
];
const etherProducts = [
	{
		productId: '0.001_eth',
		amount: 0.001
	},
	{
		productId: '0.002_eth',
		amount: 0.002
	},
	{
		productId: '0.005_eth',
		amount: 0.005
	}
];

const Sequelize = require('sequelize');
const sequelize = new Sequelize(
	'game',
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{ host: process.env.DB_HOST, dialect: 'mysql', operatorsAliases: false, pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }}
);
const Op = Sequelize.Op;

// #region Tables

const User = sequelize.define('users', {
	username: { type: Sequelize.STRING },
	device_id: { type: Sequelize.STRING },
	firebase_token: { type: Sequelize.STRING },
	gold: { type: Sequelize.INTEGER },
	eth_address: { type: Sequelize.STRING },
	level: { type: Sequelize.INTEGER },
	profile_description: { type: Sequelize.STRING },
	image_url: { type: Sequelize.STRING }
});

User.prototype.toJSON = function () {
	var values = Object.assign({}, this.get());
	delete values.device_id;
	return values;
}

const Item = sequelize.define('items', {
	identifier: { type: Sequelize.STRING },
	name: { type: Sequelize.STRING },
	description: { type: Sequelize.STRING },
	positive_attributes: { type: Sequelize.STRING },
	negative_attributes: { type: Sequelize.STRING },
	gold_cost: { type: Sequelize.INTEGER },
	money_cost: { type: Sequelize.INTEGER },
	wood: { type: Sequelize.INTEGER },
	oil: { type: Sequelize.INTEGER },
	spawn_time: { type: Sequelize.INTEGER },
	hit_points: { type: Sequelize.INTEGER },
	damage: { type: Sequelize.INTEGER },
	shoot_delay: { type: Sequelize.FLOAT },
	range: { type: Sequelize.INTEGER },
	speed: { type: Sequelize.FLOAT }
}, {
	timestamps: false
});
Item.prototype.toJSON =  function () {
	var values = Object.assign({}, this.get());
	if (values.tags !== undefined) {
		let tagNames = [];
		values.tags.forEach(tag => {
			tagNames.push(tag.name);
		});
		values.tags = tagNames;
	}
  return values;
}

const defaultItems = ['builder', 'unit', 'standard_tank', 'passenger_ship', 'fighter_jet'];

const InventoryItem = sequelize.define('inventory_items', { });
InventoryItem.belongsTo(Item, { foreignKey: 'item_id' });
User.hasMany(InventoryItem, { as: 'Inventory', foreignKey: 'user_id' });

InventoryItem.prototype.toJSON =  function () {
	var values = Object.assign({}, this.get());
	values.itemJson = JSON.stringify(values.item);
  delete values.item;
  return values;
}

const Tag = sequelize.define('tags', { name: { type: Sequelize.STRING } }, { timestamps: false });
const TagOnItem = sequelize.define('tags_on_items', {
	id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
	},
	item_id: {
		type: Sequelize.INTEGER
	},
	tag_id: {
		type: Sequelize.INTEGER
	}
}, { timestamps: false });

Item.belongsToMany(Tag, {
  through: {
    model: TagOnItem,
    unique: false,
  },
	foreignKey: 'item_id',
  constraints: false
});
Tag.belongsToMany(Item, {
  through: {
    model: TagOnItem,
    unique: false
  },
  foreignKey: 'tag_id',
  constraints: false
});

const Friend = sequelize.define('friends', { }, { timestamps: false });
Friend.belongsTo(User, { foreignKey: 'friend_id' });
User.hasMany(Friend, { as: 'Friends', foreignKey: 'user_id' });

const FriendRequest = sequelize.define('friend_requests', { });
User.hasMany(FriendRequest, { as: 'FriendRequests', foreignKey: 'reciever_id' });

User.findOne({ where: { id: 7} })
.then(user => {
	
});

// #endregion

sequelize.authenticate()
.catch(error => {
	console.error(`Unable to connect to the database: '${error}'.`);
});

// Express routing
app.get('/', (req, res) => {
	res.send('Node JS Application');
});

app.listen(process.env.PORT, () => {
	console.log(`app.js is listening on port ${process.env.PORT}.`);
});

// Requires a deviceId and a username (username if registering for the first time).
app.post('/login', (req, res) => {
	try {
		if (req.body.deviceId) {
			var hash = sha256(req.body.deviceId);
			User.findOrCreate({
				where: {
					device_id: hash
				},
				defaults: {
					username: req.body.username,
					level: 1
				}
			})
			.spread((user, created) => {

				// Give new users all default items.
				if (created) {
					defaultItems.forEach(item => {
						InventoryItem.create({
							user_id: user.id,
							item_id: item.id
						});
					});
				}
	
				var token = jwt.sign({ id: user.id }, privateKey, { expiresIn: 86400 /* expires in 24 hours */ });
				res.status(200).send({ auth: true, token: token, jsonUser: JSON.stringify(user.toJSON()), created: created });
			});
		}
	}
	catch (error) {
		res.status(500).send({ auth: false, error: error });
	}
});

function sha256(input) {
	return crypto.createHmac('sha256', process.env.SALT).update(input).digest('base64');
}

// Requires a userId.
app.post('/inventory', (req, res) => {

	InventoryItem.findAll({
		where: { user_id: req.body.userId },
		include: [{ model: Item }]
	})
	.then(inventory => {
		inventory.forEach(item => {
			item = item.toJSON();
		});
		res.status(200).send(JSON.stringify({ inventory: inventory }));
	});

});

// Requires a token and userId.
app.post('/goldBalance', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		res.status(200).send({ gold: user.gold });
	});
});

// Requires a token, userId, and gold amount.
app.post('/giveGold', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		user.gold += req.body.gold;
		user.save();
	});
});

app.post('/allItems', (req, res) => {

	Item.findAll({
		include: [{ model: Tag }]
	})
	.then(items => {
		res.send(items);
	});

});

// requires a token, userId, and itemId.
app.post('/purchase', (req, res) => {

	if (req.body.token) {
		const result = jwt.verify(req.body.token, privateKey, { expiresIn: 86400 /* 24 hours */, algorithm: "RS256" });
		if (result.id == req.body.userId) {
			
			User.findOne({
				where: {
					'id': result.id
				}
			})
			.then(user => {
				Item.findOne({
					where: {
						'id': req.body.itemId
					}
				})
				.then(storeItem => {
					let goldBalance = parseInt(user.gold);
					let cost = parseInt(storeItem.gold_cost);
					if (goldBalance >= cost) {
						InventoryItem.create({
							item_id: req.body.itemId,
							user_id: user.id
						})
						.then(inventoryItem => {
							let gold = goldBalance - cost;
							user.gold = gold;
							user.save();
							res.status(200).send({ success: true });
						})
						.catch(error => {
							
						});
					}
					else {
						res.status(500).send({ success: false, error: 'Not enough gold to purchase.' });
					}
				});
			});
		}
		else {
			res.status(403).send({ success: false, error: 'Authentication failed.' });
		}
	}
});

// Requires a token, userId, and newUrl.
app.post('/setImageURL', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		user.image_url = req.body.newUrl;
		user.save();
	});
});

// Requires a userId
app.post('/profile', (req, res) => {
	User.findOne({
		where: {
			id: req.body.userId
		}
	})
	.then(user => {
		res.status(200).send(user.toJSON());
	});
});

// Requires a token, userId, and user data
app.post('/updateUser', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		user.update(JSON.parse(req.body.userData));
		res.status(200).send({ success: true });
	});
});

// Requires a token and userId.
app.post('/friends', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		user.getFriends().then(returnedFriends => {
			let friends = [];
			if (returnedFriends.length > 0) {
				for (var i = 0; i < returnedFriends.length; i++) {
					returnedFriends[i].getUser().then(user => {
						
						friends.push(user);
	
						if (i == returnedFriends.length)
							res.status(200).send(JSON.stringify(friends));
					});
				}
			}
			else {
				res.status(200).send([]);
			}
		});
	});
});

app.post('/friendRequests', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		user.getFriendRequests().then(requests => {
			res.status(200).send(requests);
		});
	});
});

// Requires a token, userId, and recieverId.
app.post('/sendFriendRequest', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		FriendRequest.create({
			sender_id: user.id,
			reciever_id: req.body.recieverId
		})
	});
});

// Requires a token, userId, and reciept.
app.post('/reciept', (req, res) => {
	getUser(res, req.body.token, req.body.userId, user => {
		iap.setup()
		.then(() => {
			let unityReciept = JSON.parse(req.body.reciept);
	
			iap.validateOnce(unityReciept, googlePublic)
			.then(validatedData => {
				var options = {
					ignoreCanceled: true,
					ignoreExpired: true
				};
				let purchaseData = iap.getPurchaseData(validatedData, options);
				completePurchase(purchaseData[0].productId, user, res);
			})
			.catch(error => {
				res.status(500).send({ success: false });
			});
		})
		.catch((error) => {
			res.status(500).send({ success: false });
		});
	});
});

// #region Real time trading
var trades = [];
var io = require('socket.io')({
	transports: ['websocket'],
});
io.attach(4444);
io.on('connection', socket => {
	socket.on('tradeInvite', msg => {
		if (msg.accepted) {
			let tradeId = uuidv4();
			io.emit('startTrade', { trader1: msg.senderId, trader2: msg.recieverId, tradeId: tradeId });
			let newTrade = {
				tradeId: tradeId,
				trader1Id: msg.senderId,
				trader2Id: msg.recieverId,
				trader1Offer: [],
				trader2Offer: [],
				isTrader1Ready: false,
				isTrader2Ready: false,
				trader1Confirmed: false,
				trader2Confirmed: false,
				trader1Crypto: 0,
				trader2Crypto: 0
			};
			trades.push(newTrade);
		}
	});

	socket.on('trading', msg => {
		let trade = getTrade(msg.tradeId);

		if (msg.action == 'add') {
			if (msg.senderId == trade.trader1Id) {
				trade.trader1Offer.push(msg.inventoryItemId);
			}
			else if (msg.senderId == trade.trader2Id) {
				trade.trader2Offer.push(msg.inventoryItemId);
			}
		}
		else if (msg.action == 'remove') {
			if (msg.senderId == trade.trader1Id) {
				for (var i = 0; i < trade.trader1Offer.length; i++) {
					if (trade.trader1Offer[i] == msg.inventoryItemId)
						trade.trader1Offer.splice(i, 1);
				}
			}
			else if (msg.senderId == trade.trader2Id) {
				for (var i = 0; i < trade.trader2Offer.length; i++) {
					if (trade.trader2Offer[i] == msg.inventoryItemId)
						trade.trader2Offer.splice(i, 1);
				}
			}
		}
		else if (msg.action == 'crypto') {
			if (msg.senderId == trade.trader1Id) {
				trade.trader1Crypto = msg.crypto;
			}
			else if (msg.senderId == trade.trader2Id) {
				trade.trader2Crypto = msg.crypto;
			}
		}

		if (msg.updateReady) {
			if (msg.senderId == trade.trader1Id) {
				trade.isTrader1Ready = msg.isTrader1Ready;
			}
			else if (msg.senderId == trade.trader2Id) {
				trade.isTrader2Ready = msg.isTrader2Ready;
			}
		}
		
		msg.isTrader1Ready = trade.isTrader1Ready;
		msg.isTrader2Ready = trade.isTrader2Ready;

		if (msg.makeTrade && (trade.isTrader1Ready && trade.isTrader2Ready)) {
			if (msg.senderId == trade.trader1Id) {
				trade.trader1Confirmed = true;
			}
			else if (msg.senderId == trade.trader2Id) {
				trade.trader2Confirmed = true;
			}

			if (trade.trader1Confirmed && trade.trader2Confirmed) {
				for (let i = 0; i < trade.trader1Offer.length; i++) {
					InventoryItem.findOne({
						where: {
							id: trade.trader1Offer[i]
						}
					}).then(item => {
						item.update({ user_id: trade.trader2Id });
					});
				}
				for (let i = 0; i < trade.trader2Offer.length; i++) {
					InventoryItem.findOne({
						where: {
							id: trade.trader2Offer[i]
						}
					}).then(item => {
						item.update({ user_id: trade.trader1Id });
					});

					msg.success = true;
				}
			}
		}

		User.findOne({
			where: {
				id: msg.senderId
			}
		}).then(user => {
			msg.senderUsername = user.username;
			console.log(trades);
			io.emit('trading', msg);
		});
	});
});
// #endregion

function completePurchase(productId, user, res) {
	goldProducts.forEach(product => {
		if (product.productId === productId) {
			let goldBalance = parseInt(user.gold);
			goldBalance += product.amount;
			user.gold = goldBalance;
			user.save();
			res.status(200).send({ success: true });
			return;
		}
	});

	cryptoGoldProducts.forEach(product => {
		if (product.productId === productId) {
			ethereum.mintToken(user.eth_address, product.amount);
			res.status(200).send({ success: true });
			return;
		}
	});

	etherProducts.forEach(product => {
		if (product.productId === productId) {
			ethereum.sendEther(user.eth_address, product.amount);
			res.status(200).send({ success: true });
			return;
		}
	});
}

function getUser(res, token, userId, callback) {
	if (token) {
		const result = jwt.verify(token, privateKey, { expiresIn: 86400 /* expires in 24 hours */ });
		if (result.id == userId) {
			
			User.findOne({
				where: {
					id: result.id
				}
			})
			.then(user => {
				callback(user);
			})
			.catch(error => {
				res.status(500).send({ success: false });
			})
		}
		else {
			res.sendStatus(403);
		}
	}
}

function giveAllItemsTo(userId) {
	Item.findAll({}).then(items => {
		items.forEach(item => {
			InventoryItem.create({
				item_id: item.id,
				user_id: userId
			});
		});
	});
}
