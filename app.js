const express = require('express');
const app = express();

require('dotenv').load();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const fs   = require('fs');
const jwt = require('jsonwebtoken');
//const publicKey  = fs.readFileSync('./public.key', 'utf8');
const privateKey  = fs.readFileSync('./private.key', 'utf8');
//const googlePublic = fs.readFileSync('./googlePublic.key', 'utf8');

const crypto = require('crypto');
const uuidv4 = require('uuid/v4');

/*const ethereum = require('./ethereum.js');
const BigNumber = require('bignumber.js');*/

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
	'nbase',
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{ host: process.env.DB_HOST, logging: false, dialect: 'mysql', operatorsAliases: false, pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }}
);
const Op = Sequelize.Op;

// #region Tables

const User = sequelize.define('users', {
	id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
	},
	username: { type: Sequelize.STRING },
	facebook_id: { type: Sequelize.STRING },
	login_type: {
    type:   Sequelize.ENUM,
    values: ['nbase', 'facebook']
	},
	logins: { type: Sequelize.INTEGER },
	device_id: { type: Sequelize.STRING },
	firebase_token: { type: Sequelize.STRING },
	gold: { type: Sequelize.INTEGER },
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

const defaultItems = [12, 13, 35, 17, 23];

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

/*const FriendRequest = sequelize.define('friend_requests', { });
User.hasMany(FriendRequest, { as: 'FriendRequests', foreignKey: 'reciever_id' });

/*const Listing = sequelize.define('listings', {
	user_id: { type: Sequelize.INTEGER },
	price: { type: Sequelize.STRING },
	address: { type: Sequelize.STRING },
	item_identifier: { type: Sequelize.STRING },
	state: {
    type:   Sequelize.ENUM,
    values: ['Pending', 'Sold']
  }
});
Listing.belongsTo(InventoryItem, { foreignKey: 'inventory_item_id' });

const Trader = sequelize.define('traders', {
	id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
	},
	user_id: { type: Sequelize.INTEGER },
	other_trader_user_id: { type: Sequelize.INTEGER },
	is_ready: { type: Sequelize.BOOLEAN },
	has_confirmed: { type: Sequelize.BOOLEAN },
	tokens_offered: { type: Sequelize.DECIMAL },
}, {
	timestamps: false
});
Trader.belongsTo(User, { foreignKey: 'user_id', as: 'User' });

const ItemInTrade = sequelize.define('items_in_trades', {
	inventory_item_id: { type: Sequelize.INTEGER },
	trader_id: { type: Sequelize.INTEGER },
}, {
	timestamps: false
});*/

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
					facebook_id: req.body.facebook_id,
					login_type: req.body.login_type,
					level: 1
				}
			})
			.spread((user, created) => {
				// Give new users all default items.
				if (created) {
					defaultItems.forEach(itemId => {
						InventoryItem.create({
							user_id: user.id,
							item_id: itemId
						});
					});
				}

				var logins = parseInt(user.logins);
				logins++;
				user.logins = logins;
				user.save();
	
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
		var gold = parseInt(user.gold);
		gold += parseInt(req.body.gold);
		user.gold = gold;
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
	Friend.findAll({where: {user_id: req.body.userId}}).then(returnedFriends => {
		let friends = [];
		if (returnedFriends.length > 0) {
			for (var c = 0; c < returnedFriends.length; c++) {
				returnedFriends[c].getUser().then(user => {
					friends.push(user);
					
					if (friends.length == returnedFriends.length)
						res.status(200).send(JSON.stringify(friends));
				});
			}
		}
		else {
			res.status(200).send([]);
		}
	});
});

// Requires an array of facebook IDs
app.post('/facebookFriends', (req, res) => {
	var facebookIds = JSON.parse(req.body.facebookIds);
	var users = [];
	for (let i = 0; i < facebookIds.length; i++) {
		let facebookId = facebookIds[i];
		User.findOne({ where: { facebook_id: facebookId } }).then(user => {
			users.push(user);
			
			if (i == facebookIds.length - 1)
				res.status(200).send(users);
		});
	};
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
		});
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

app.post('/listings', (req, res) => {
  Listing.findAll({
		where: {
			state: 'Pending'
		},
		include: [{ model: InventoryItem }]
	}).then(listings => {
    res.status(200).send(listings);
	});
});

app.post('/newListing', (req, res) => {
	if (req.body.token) {
		const result = jwt.verify(req.body.token, privateKey, { expiresIn: 86400 });
		if (result.id == req.body.userId) {
			var request = JSON.parse(req.body.listRequest);
			InventoryItem.findOne({
				where: {
					id: request.InventoryItemId
				}
			}).then(item => {
				if (item !== null && item.user_id == req.body.userId) {
					Listing.create({
						user_id: item.user_id,
						inventory_item_id: request.InventoryItemId,
						item_identifier: request.Identifier,
						price: ethereum.toHex(request.Price),
						address: ethereum.getAddress(request.PrivateKey)
					});
					res.status(200);
				}
				else {
					res.status(500);
				}

			});
		}
	}
});

app.post('/buyMarketItem', (req, res) => {
	try {
		let request = JSON.parse(req.body.marketBuyRequest);
		getUser(res, req.body.token, req.body.userId, user => {
			Listing.findOne({
				where: {
					id: request.Id
				}
			})
			.then(listing => {
				if (listing !== null && listing.state == 'Pending') {
					InventoryItem.findOne({
						where: { id: listing.inventory_item_id }
					}).then(inventoryItem => {
						inventoryItem.user_id = req.body.userId;
						inventoryItem.save();

						ethereum.transferFrom(request.Address, listing.address, listing.price);
	
						listing.state = 'Sold';
						listing.save();
	
						res.status(200).send({ success: true });
					});
				}
			});
		});
	}
	catch (error) {
		res.status(500).send({ success: false });
	}
});

// SELECT t1.* FROM listings t1 WHERE state = 'Sold' AND t1.updatedAt = (SELECT MAX(t2.updatedAt) FROM listings t2 WHERE t2.item_identifier = t1.item_identifier)
app.post('/lastSolds', (req, res) => {
	Listing.findAll({
		where: {
			state: 'Sold'
		},
		order: [
			['updatedAt', 'ASC']
		]
	}).then(soldListings => {
		res.status(200).send(soldListings);
	});
});

// #region Real time trading and chat

var io = require('socket.io')({
	transports: ['websocket'],
});
io.attach(4444);
io.on('connection', socket => {
	socket.on('tradeInvite', msg => {
		if (msg.accepted) {
			io.emit('startTrade', { trader1: msg.senderId, trader2: msg.recieverId });

			Trader.create({ user_id: msg.senderId, other_trader_user_id: msg.recieverId });
			Trader.create({ user_id: msg.recieverId, other_trader_user_id: msg.senderId });
		}
	});

	socket.on('chat', msg => {
		io.emit('chat', msg);
	});

	socket.on('trading', msg => {
		if (msg.token) {
			const result = jwt.verify(msg.token, privateKey, { expiresIn: 86400 /* expires in 24 hours */ });
			if (result.id == msg.senderId) {

				Trader.findOne({
					where: {
						user_id: msg.senderId
					}
				}).then(trader => {
					if (msg.inventoryItemId !== undefined) {
						InventoryItem.findOne({
							where: {
								id: msg.inventoryItemId,
								user_id: msg.senderId
							}
						}).then(item => {
							if (item !== null) {
			
								if (msg.action == 'add') {
									ItemInTrade.create({
										inventory_item_id: item.id,
										trader_id: trader.id
									});;
								}
								else if (msg.action == 'remove') {
									ItemInTrade.findOne({
										where: {
											inventory_item_id: msg.inventoryItemId
										}
									}).then(tradeItem => {
										return tradeItem.destroy();
									});
								}
							}
						});
					}
		
					if (msg.action == 'crypto') {
						trader.tokens_offered = msg.crypto;
						trader.save();
					}
					else if (msg.action == 'update_ready') {
						trader.is_ready = msg.isReady;
						trader.save();
					}
		
					if (msg.makeTrade) {
						trader.has_confirmed = true;
						trader.save();
					}
					
					Trader.findOne({
						where: {
							user_id: trader.other_trader_user_id
						}
					}).then(otherTrader => {
						msg.areYouReady = trader.is_ready;
						msg.isOtherTraderReady = otherTrader.is_ready;
		
						if (msg.action == 'exit') {
							closeTrade(trader.user_id, otherTrader.user_id);
						}
		
						if (msg.makeTrade && (trader.is_ready && otherTrader.is_ready)) {
		
							if (trader.has_confirmed && otherTrader.has_confirmed) {
								
								if (trader.tokens_offered > 0 || otherTrader.tokens_offered > 0) {

									User.findOne({ where: { id: trader.user_id }}).then(user => {
										User.findOne({ where: { id: otherTrader.user_id }}).then(otherUser => {

											let traderAllowance = BigNumber(ethereum.getAllowance(user.eth_address));
											let otherTraderAllowance = BigNumber(ethereum.getAllowance(otherUser.eth_address));
											let traderOK = traderAllowance.isGreaterThanOrEqualTo(BigNumber(ethereum.toWei(trader.tokens_offered)));
											let otherTraderOK = otherTraderAllowance.isGreaterThanOrEqualTo(BigNumber(ethereum.toWei(otherTrader.tokens_offered)));

											if (traderOK && otherTraderOK) {
												if (trader.tokens_offered > 0)
													ethereum.transferFrom(user.eth_address, otherUser.eth_address, trader.tokens_offered);

												if (otherTrader.tokens_offered > 0)
													ethereum.transferFrom(otherUser.eth_address, user.eth_address, otherTrader.tokens_offered);
											}
											else {
												closeTrade(trader.user_id, otherTrader.user_id);
												return;
											}
										});
									});
								}

								tradeItems(trader.id, otherTrader.user_id);
								tradeItems(otherTrader.id, trader.user_id);

								closeTrade(trader.user_id, otherTrader.user_id);
								msg.success = true;
							}
						}
		
						User.findOne({
							where: {
								id: trader.user_id
							}
						}).then(user => {
							msg.senderUsername = user.username;
							io.emit('trading', msg);
						});
					});
				});

			}
		}
	});
	
});

function closeTrade(userId, otherUserId) {
	Trader.findAll({
		where: { 
			user_id: {
				[Op.or]: [userId, otherUserId]
			}
		}
	}).then(traders => {
		traders.forEach(trader => {
			ItemInTrade.findAll({
				where: { 
					trader_id: trader.id
				}
			}).then(tradeItems => {
				tradeItems.forEach(tradeItem => {
					tradeItem.destroy();
				});
				trader.destroy();
			});
		});
	});
}
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

// from: trader_id, to: user-id
function tradeItems(from, to) {
	ItemInTrade.findAll({
		where: {
			trader_id: from
		}
	}).then(tradeItems => {
		tradeItems.forEach(tradeItem => {
			InventoryItem.findOne({
				where: { id: tradeItem.inventory_item_id }
			}).then(inventoryItem => {
				console.log(inventoryItem.id);
				inventoryItem.user_id = to;
				inventoryItem.save();
			});
		});
	});
}

app.post('/playerSearch', (req, res) => {
	User.findAll({
		where: {
			username: {
				[Op.like]: `%${req.body.username}%`
			}
		}
	}).then(users => {
		res.status(200).send(users);
	})
});