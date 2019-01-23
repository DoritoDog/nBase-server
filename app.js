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

const crypto = require('crypto');

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
	profile_description: { type: Sequelize.STRING }
});

const Item = sequelize.define('items', {
	identifier: { type: Sequelize.STRING },
	name: { type: Sequelize.STRING },
	description: { type: Sequelize.STRING },
	gold_cost: { type: Sequelize.INTEGER },
	money_cost: { type: Sequelize.INTEGER },
	wood: { type: Sequelize.INTEGER },
	oil: { type: Sequelize.INTEGER },
	spawn_time: { type: Sequelize.INTEGER },
	hit_points: { type: Sequelize.INTEGER }
}, {
	timestamps: false
});

const InventoryItem = sequelize.define('inventory_items', { });
InventoryItem.belongsTo(User, { 'foreignKey': 'user_id' });
InventoryItem.belongsTo(Item, { 'foreignKey': 'item_id' });

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

app.post('/login', (req, res) => {
	if (req.body.deviceId) {
		var hash = sha256(req.body.deviceId);
		User.findOne({
			where: {
				device_id: hash
			}
		})
		.then(user => {
			var token = jwt.sign({ id: user.id }, privateKey, { expiresIn: 86400 /* 24 hours */ });
			res.status(200).send({ auth: true, token: token });
		});
	}
});

app.post('/register', (req, res) => {
	if (req.body.username && req.body.deviceId) {
		var sql = 'INSERT INTO users (username, device_id) VALUES (?, ?)';
		queryDB(sql, [req.body.username, sha256(req.body.deviceId)], result => {
			var token = jwt.sign({ id: mysql.insertId }, privateKey, { expiresIn: 86400 /* 24 hours */, algorithm: "RS256" });
			res.status(200).send({ auth: true, token: token });
		});
	}
});

function sha256(input) {
	return crypto.createHmac('sha256', process.env.SALT).update(input).digest('base64');
}

app.post('/inventory', (req, res) => {

	InventoryItem.findAll({
		where: { user_id: req.body.userId },
		include: [{ model: Item }]
	})
	.then(inventory => {
		res.send(JSON.stringify(inventory));
	});

});

app.post('/storeItems', (req, res) => {

	Item.findAll({
		where: {
			gold_cost: {
				[Op.not]: [0]
			}
		}
	})
	.then(items => {
		res.send(JSON.stringify(items));
	});

});

// requires a token, userId, and itemId
app.post('/purchase', (req, res) => {

	if (req.body.token) {
		const result = jwt.verify(req.body.token, publicKey, { expiresIn: 86400 /* 24 hours */, algorithm: "RS256" });
		if (result.id == req.body.userId) {
			
			User.findOne({
				where: {
					id: result.id
				}
			})
			.then(user => {
				Item.findOne({
					item_id: req.body.itemId
				})
				.then(storeItem => {
					InventoryItem.create({
						item_id: req.body.itemId,
						user_id: user.id
					})
					.then(inventoryItem => {
						let gold = parseInt(user.gold) - parseInt(storeItem.gold_cost);
						user.gold = gold;
						user.save();
					})
					.catch(error => {
						res.sendStatus(500);
					});
				});
			});

			res.sendStatus(200);
		}
		else {
			res.sendStatus(403);
		}
	}
	
});