var config = require('../config').config;
var util = require('../libs/util');
var failRes = util.failRes;
var successRes = util.successRes;

/**
 * 需要管理员权限,跳转
 */
exports.adminRequired = function (req, res, next) {
	if (!req.session.user) {
		req.session._loginReferer = req.route.path;
		return res.redirect('/login#msg=login_required');
	}
	if (!req.session.user.is_admin) {
		return res.redirect('/login#msg=admin_required');
	}
	next();
};
/**
 * 需要管理员权限,JSON
 */
exports.adminRequiredJSON = function (req, res, next) {
	if (!req.session.user) {
		return failRes(res,'登录后才能进行以下操作！');
	}
	if (!req.session.user.is_admin) {
		return failRes(res,'管理员才能进行相应操作！');
	}
	next();
};

/**
 * 需要登录，跳转
 */
exports.userRequired = function (req, res, next) {
	if (!req.session || !req.session.user) {
		req.session._loginReferer = req.route.path;
		return res.redirect('/login#msg=login_required');
	}
	next();
};

/**
 * 需要登录，JSON
 */
exports.userRequiredJSON = function (req, res, next) {
	if (!req.session || !req.session.user) {
		return failRes(res,'登录后才能进行以下操作！');
	}
	next();
};

//验证token
exports.tokenRequired = function (req, res, next){
	var tkey = req.cookies[config.auth_cookie_name];
	if (!tkey) {
		return tokenFailRes(req, res, next);
	}
	var token = getToken(tkey);
	var _token = req.query && req.query._token || req.body && req.body._token;
	if(token!=_token){
		return tokenFailRes(req, res, next);
	}
	next();
};

exports.tokenRequiredJSON = function (req, res, next){
	var tkey = req.cookies[config.auth_cookie_name];
	if (!tkey) {
		return tokenFailRes(req, res, next, "JSON");
	}
	var token = getToken(tkey);
	var _token = req.query && req.query._token || req.body && req.body._token;
	if(token!=_token){
		return tokenFailRes(req, res, next, "JSON");
	}
	next();
};

function tokenFailRes(req, res, next, type){
	if(type=="JSON"){
		return failRes(res,'token错误，请确认后再试！');
	}else{
		return res.redirect('/login#msg=token_error');
	}
};
//获取token
function getToken(tkey){
	var hash = 5381, str = tkey.substring(0,10);
	for (var i = 0, len = str.length; i < len; ++i) {
		hash += (hash << 5) + str.charCodeAt(i);
	}
	return hash & 0x7fffffff;
}