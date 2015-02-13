/**
 * 数据库连接
 */
var mongoose = require('mongoose');
var config = require('../config').config;
var util = require('../libs/util');

console.log('Running mongoose version %s', mongoose.version);

var db = exports.Db = mongoose.createConnection();
var options = {
	db: { native_parser: true },
	server: { 
		poolSize: 5,
		auto_reconnect:true
	},
	user: config.username,
	pass: config.password
};

function connect(){
	console.log('mongodb start connect at '+util.format_date(new Date(),false));
	try{
		db.open(config.db_host, config.db_name, config.db_port, options);
	}catch(e){
		console.error(e);
		console.log('db.open err at '+util.format_date(new Date(),false));
	}
};

//监听BAE mongodb异常后断开闲置连接
db.on('error', function (err) {
	console.log('mongodb error at '+util.format_date(new Date(),false));
	mongoose.disconnect();
});

//监听db disconnected event并重新连接
db.on('disconnected', function () {
	console.log('mongodb disconnected and start reconnect at '+util.format_date(new Date(),false));
	connect();
});

db.once('open', function () {
	console.log('mongodb open at '+util.format_date(new Date(),false));
});

db.on('reconnected', function () {
	console.log('MongoDB reconnected! at '+util.format_date(new Date(),false));
});

db.on('connected', function() {
	console.log('MongoDB connected! at '+util.format_date(new Date(),false));
});

connect();