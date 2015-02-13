/**
 * tuijs - 推即时
 * Module dependencies.
 */
var port = 18080;
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var config = require('./config').config;
var Db = require("./models/db").Db;

var SessionStore = require("session-mongoose")(express);
var store = new SessionStore({
	connection : Db,
	interval : 1000 * 60 * 60 * 24,  //millisec 1Day
	ttl : 3600 //seconds
}); 

var app = express();
// all environments
app.set('port', port || 3000);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set("view cache", true);
app.engine('html', require('ejs').renderFile);
app.use(express.favicon(__dirname + '/public/favicon.ico'));

//设置全局变量
app.locals({
	name : config.name,
	website_name : config.website_name,
	website_slogan : config.website_slogan,
	kewords : config.kewords,
	description : config.description,
	resVersion : config.resVersion,
	cdn : config.cdn_list[config.currCDN]
});

app.use(express.cookieParser());
app.use(express.session({
	secret: config.session_secret,
	store: store,
	cookie: {maxAge: 1000 * 60 * 60 * 2},//过期时间：2小时
}));

app.use(express.bodyParser({uploadDir:'./upload'}));
app.use(express.methodOverride());

//user middleware
app.use(require('./controllers/sign').auth_user);
app.use(express.static(path.join(__dirname, 'public')));

http.createServer(app).listen(app.get('port'), function(){
	console.log('www.tuijs.com start on port ' + app.get('port'));
});

routes(app);