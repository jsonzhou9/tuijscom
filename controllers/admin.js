/*
 * 用户注册登录模块
 */
var querystring = require('querystring');
var check = require('validator').check,
    sanitize = require('validator').sanitize;
var Category = require("../models_extend").Category;
var User = require("../models_extend").User;
var config = require('../config').config;
var util = require('../libs/util');
var EventProxy = require('eventproxy');
var failRes = util.failRes;
var successRes = util.successRes;

/**
 * 用户管理
 */
exports.showAdminUser = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var keyword = req.query.q;
	var limit = 12;
	var query = {};
	
	if(keyword){
		keyword = keyword.replace(/[\*\^\&\(\)\[\]\+\?\\]/g, '');
    	query.username = new RegExp(keyword, 'i');
	}
	if(req.query){
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
		
		if(req.query.linkid){
			var linkid = req.query.linkid;
			if(linkid==1){
				query.email_active = false;
			}else if(linkid==2){
				query.email_active = true;
			}else if(linkid==3){
				query.active = true;
			}else if(linkid==4){
				query.active = false;
			}
		}
	}
	
	var render = function(userlist,pages){
		res.render("admin_user",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			userlist : userlist,
			linkid : req.query.linkid ? req.query.linkid : 0
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'create_at' : 'desc'} };
	var proxy = EventProxy.create('userlist', 'pages', render);
	proxy.fail(next);
	
	User.getUsersByQuery(query,options,proxy.done('userlist'));
	
	User.getCountByQuery(query,proxy.done(function (count) {
    	var pages = Math.ceil(count / limit);
    	proxy.emit('pages',{
			count:count,
			pages:pages
		});
  	}));
};

exports.lockUser = function (req, res, next) {
	var id = req.query.id;
	User.findByIdAndUpdate(id,{active:false},function(err){
		if(err){
			return next(err);
		}					
		successRes(res,"用户锁定成功！");
	});
};
exports.unlockUser = function (req, res, next) {
	var id = req.query.id;
	User.findByIdAndUpdate(id,{active:true},function(err){
		if(err){
			return next(err);
		}					
		successRes(res,"用户解锁成功！");
	});
};
exports.viewUser = function (req, res, next) {
	var id = req.query.id;
	User.findById(id,function(err,user){
		if(err){
			return next(err);
		}
		var userData = {}
		if(user){
			userData.create_at = util.format_date(user.create_at);
			userData.email_active = user.email_active ? "已激活" : "未激活";
			userData.active = user.active ? "正常" : "锁定";
			userData.username = user.username;
			userData.email = user.email;
			userData.score = user.score;
			userData.topic_count = user.topic_count;
		}
		
		successRes(res,userData);
	});
};

/**
 * 栏目管理
 */
exports.showColumn = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	Category.getCategoryByQuery({},{},function(err,columns){
		if(err){
			return next(err);
		}
		columns = columns ||[];
		res.render('column',{columns:columns});
	});
};

exports.saveColumn = function (req, res, next) {
	var id = sanitize(req.body.id).trim();
	var type = sanitize(req.body.type).trim();
	var name_cn = sanitize(req.body.name_cn).trim();
	var name_en = sanitize(req.body.name_en).trim();
	name_en = name_en.toLowerCase();
	if (name_cn === '' || name_en === '') {
		failRes(res,"栏目名称不能为空！");
		return;
	}
	
	if(!id){ //新增
		Category.getCategoryByQuery({'$or': [{'name_cn': name_cn}, {'name_en': name_en}]}, {}, function(err,columns){
			if(err){
				return next(err);
			}
			if (columns.length > 0) {
				failRes(res,"栏目名称已被使用！");
				return;
			}
			//保存
			Category.newAndSave(type,name_cn,name_en,function(err){
				if(err){
					return next(err);
				}
				successRes(res,"栏目添加成功！");
			});
		});
	}else{ //修改
		Category.findByIdAndUpdate(id,{name_cn:name_cn,name_en:name_en,type:type},function(err){
			if(err){
				return next(err);
			}
			successRes(res,"栏目修改成功！");
		});
	}
};

exports.delColumn = function (req, res, next) {
	var id = req.query.id;
	Category.findByIdAndRemove(id,function(err){
		if(err){
			return next(err);
		}					
		successRes(res,"栏目删除成功！");
	});
};

exports.hideColumn = function (req, res, next) {
	var id = req.query.id;
	Category.findByIdAndUpdate(id,{isdel:true},function(err){
		if(err){
			return next(err);
		}					
		successRes(res,"栏目删除成功！");
	});
};

exports.restoreDelColumn = function (req, res, next) {
	var id = req.query.id;
	Category.findByIdAndUpdate(id,{isdel:false},function(err){
		if(err){
			return next(err);
		}					
		successRes(res,"栏目恢复成功！");
	});
};

function extend(o, c){
    if(o && c && typeof c == "object"){
        for(var p in c){
            o[p] = c[p];
        }
    }
    return o;
};