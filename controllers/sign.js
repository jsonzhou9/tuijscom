/*
 * 用户注册登录模块
 */
var check = require('validator').check,
    sanitize = require('validator').sanitize;
var models = require("../models_extend");
var User = models.User;
var crypto = require('crypto');
var config = require('../config').config;
var util = require('../libs/util');
var failRes = util.failRes;
var successRes = util.successRes;

exports.showPassword = function (req, res, next) {
	res.render('notice',{notice_msg:'密码修改功能正在开发中...<br />找回密码请发邮件至'+config.adminEmail});
};

exports.showlogin = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	res.render('sign/login');
};

exports.showreg = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	res.render('sign/register');
};

exports.login = function (req, res, next) {
	var loginname = sanitize(req.body.loginname).trim().toLowerCase();
	var password = sanitize(req.body.password).trim();
	
	if (!loginname || !password) {
    	failRes(res,'信息不完整。');
		return;
	}
	
	User.getUserByLoginName(loginname, function (err, user) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return failRes(res,'用户名或邮箱不存在！');
		}
		
		//password = md5(password);//前台MD5，密文传输
		if (password !== user.password) {
			return failRes(res,'输入的密码错误！' );
		}
		
		if (!user.active){
			return failRes(res,'很抱歉，您的账号存在异常行为，账号已被锁定，请联系管理员进行解封！'+config.adminEmail );
		}
		
		//登录成功
		gen_session(user,res);
		req.session.user = user;
		res.locals.current_user = req.session.user;
		
		var refer = req.session._loginReferer || '/';
		if(req.session._loginReferer) req.session._loginReferer = null; //清空
		return successRes(res,{msg:"登录成功，页面即将跳转！",url:refer});
	});
};

exports.signout = function (req, res, next) {
	req.session.user = null;
	res.clearCookie(config.auth_cookie_name, { path: '/' });
	res.redirect('/login');
};

exports.register = function (req, res, next) {
	var email = sanitize(req.body.email).trim();
	email = email.toLowerCase();
	
	var username = sanitize(req.body.username).trim();
	username = username.toLowerCase();
	
	var password = sanitize(req.body.password).trim();
	
	if (username === '' || password === '' || email === '') {
		failRes(res,'信息不完整。');
		return;
	}
	
	try {
		check(email, 'Email地址错误！').isEmail();
	} catch (e) {
		failRes(res,e.message);
		return;
	}
	
	try {
		check(username, '用户名长度为5至20位字符！').len(5,20);
	} catch (e) {
		failRes(res,e.message);
		return;
	}
	
	try {
		check(password, '密码采用密文传输，密码加密后应该是32位！').len(32);
	} catch (e) {
		failRes(res,e.message);
		return;
	}
	
	User.getUsersByQuery({'$or': [{'username': username}, {'email': email}]}, {}, function (err, users) {
		if (err) {
			return next(err);
		}
		if (users.length > 0) {
			failRes(res,'用户名或邮箱已被使用。');
		  	return;
		}
		
		//password = md5(password);//前台MD5，密文传输
		
		User.newAndSave(email,username,password,function(err){
			if(err){
				return next(err);
			}
			successRes(res,"恭喜您注册成功，请登录！（已发送激活邮件至您的邮箱，请从邮箱激活！）");
		});
	});
};

//验证用户
exports.auth_user = function (req, res, next) {
	if (req.session.user) { //优先判断session
		if (config.admins[req.session.user.username]) {
			req.session.user.is_admin = true;
		}
		res.locals.current_user = req.session.user;
      	return next();
	}else{ //其次判断cookie中的tkey
		var cookie = req.cookies[config.auth_cookie_name];
		if (!cookie) {
      		return next();
    	}
		
		var auth_token = decrypt(cookie, config.session_secret);
		var auth = auth_token.split('\t');
    	var user_id = auth[0];
		User.getUserById(user_id, function (err, user) {
			if (err) {
				return next(err);
			}
			if (user) {
				if (config.admins[user.username]) {
					user.is_admin = true;
				}
				req.session.user = user;
				res.locals.current_user = req.session.user;
			}
			return next();
		});
	}
};

/**
 *util
 */
//生成tkey到cookie
function gen_session(user, res) {
	var auth_token = encrypt(user._id + '\t' + user.username + '\t' + '\t' + user.email, config.session_secret);
	res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000 * 60 * 60 * 24 * 14}); //cookie 有效期14天
}
//加密
function encrypt(str, secret) {
	var cipher = crypto.createCipher('aes192', secret);
	var enc = cipher.update(str, 'utf8', 'hex');
	enc += cipher.final('hex');
	return enc;
}
//解密
function decrypt(str, secret) {
	var decipher = crypto.createDecipher('aes192', secret);
	var dec = decipher.update(str, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
}

function md5(str) {
	var md5sum = crypto.createHash('md5');
	md5sum.update(str);
	str = md5sum.digest('hex');
	return str;
}