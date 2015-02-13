/*
 * 站点主要功能
 */
var models = require("../models_extend");
var config = require('../config').config;
var util = require('../libs/util');
var Lib = models.Lib;
var Tag = models.Tag;
var LibTag = models.LibTag;
var Category = models.Category;
var User = models.User;
var EventProxy = require('eventproxy');
var querystring = require('querystring');
var failRes = util.failRes;
var successRes = util.successRes;

exports.index = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var sortby = req.query && req.query.sortby;
	var keyword = req.query.q;
	var limit = config.limit;
	var query = {isok:true};
	var title = '';
	var sortList = { //查询排序
		view : {'visit_count' : 'desc'}, //最多查看
		use : {'fav_count' : 'desc'}, //最多使用
		create : {'create_at' : 'desc'}, //最新创建
		update : {'update_at' : 'desc'} //最新更新
	};
	var titleList = {
		view : '最多查看',
		use : '最多使用',
		create : '最新创建',
		update : '最新更新'
	};
	
	if(sortby && sortList[sortby]){
		title = titleList[sortby];
		sortby = sortList[sortby];
	}else{
		sortby = sortList.update;
		title = titleList.update;
	}
	
	if(keyword){
		keyword = keyword.replace(/[\*\^\&\(\)\[\]\+\?\\]/g, '');
		query['$or'] = [{'libname': new RegExp(keyword, 'i')}, {'title': new RegExp(keyword, 'i')}];
		title = '搜索 “<span class="keyword">'+keyword+'</span>” 结果';
	}
	
	if(req.query){ //页码参数处理
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
	}
	
	var render = function(toplist,liblist,pages){
		res.render("index",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			toplist : toplist || [],
			liblist : liblist,
			routePath : req.route.path,
			title : title
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: sortby };
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('toplist', 'liblist', 'pages', render);
	proxy.fail(next);

	if(page==1){ //首页需显示其它内容
		Lib.getLibByQuery({top:true},{limit: 9, sort: {'update_at' : 'desc'}},proxy.done('toplist'));
	}else{
		proxy.emit('toplist',[]);
	}

	Lib.getLibByQuery(query,options,function(err,liblist){
		if(err) return next(err);
		if(liblist && liblist.length>0){
			mainProxy.all('getCategory','getUser',function(category,user){
				proxy.emit('liblist',liblist);
			});
			
			mainProxy.after('category',liblist.length,function(list){
				mainProxy.emit('getCategory',list);
			});
			
			mainProxy.after('user',liblist.length,function(list){
				mainProxy.emit('getUser',list);
			});
			
			liblist.forEach(function(libItem){
				libItem.pubDate = util.format_date(libItem.create_at,true);
				libItem.summary = getSummary(libItem.content);
				
				Category.getCategoryById(libItem.category_id,function(err,category){
					if(err) return next(err);
					libItem.category = category;
					mainProxy.emit('category',category);
				});
				User.findById(libItem.author_id,function(err,user){
					if(err) return next(err);
					user.is_admin = config.admins[user.username];
					libItem.user = user;
					mainProxy.emit('user',user);
				});
			});
		}else{
			proxy.emit('liblist',[]);
		}
	});

	Lib.getCountByQuery(query,proxy.done(function (count) {
    	var pages = Math.ceil(count / limit);
    	proxy.emit('pages',{
			count:count,
			pages:pages
		});
  	}));
};

exports.showListForTag = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = config.limit;
	var tagname = req.params.name;
	var title = '标签 “'+tagname+'” 下的内容';

	if(req.query){ //页码参数处理
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
	}
	
	var render = function(liblist,pages){
		res.render("index",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist,
			routePath : req.route.path,
			title : title
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'update_at' : 'desc'} };
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);
	
	//查询类库列表
	var getLibList = function(libtag){
		
		mainProxy.after('getLib',libtag.length,function(liblist){
			mainProxy.all('getCategory','getUser',function(category,user){
				proxy.emit('liblist',liblist);
			});
			
			mainProxy.after('category',liblist.length,function(list){
				mainProxy.emit('getCategory',list);
			});
			
			mainProxy.after('user',liblist.length,function(list){
				mainProxy.emit('getUser',list);
			});
			
			liblist.forEach(function(libItem){
				libItem.pubDate = util.format_date(libItem.create_at,true);
				libItem.summary = getSummary(libItem.content);
				
				Category.getCategoryById(libItem.category_id,function(err,category){
					if(err) return next(err);
					libItem.category = category;
					mainProxy.emit('category',category);
				});
				User.findById(libItem.author_id,function(err,user){
					if(err) return next(err);
					user.is_admin = config.admins[user.username];
					libItem.user = user;
					mainProxy.emit('user',user);
				});
			});
		});
		
		libtag.forEach(function(libtagItem){
			Lib.getLibById(libtagItem.lib_id,mainProxy.done('getLib'));
		});
	};

	Tag.getTagByName(tagname,function(err,tag){
		if(err) return next(err);
		if(!tag) return res.render('notice',{notice_msg:'标签不存在！'});

		LibTag.getByQuery({tag_id : tag.id}, options, function(err,libtag){
			if(err) return next(err);
			
			if(libtag && libtag.length){
				getLibList(libtag);
			}else{
				return res.render('notice',{notice_msg:'标签下无内容！'});
			}
		});
		
		LibTag.getCountByQuery({tag_id : tag.id},proxy.done(function (count) {
			var pages = Math.ceil(count / limit);
			proxy.emit('pages',{
				count:count,
				pages:pages
			});
		}));
	});
};

exports.showListForUser = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = config.limit;
	var query = {isok:true};
	var username = req.params.name;
	var title = username+' 推荐的类库';

	if(req.query){ //页码参数处理
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
	}
	
	var render = function(liblist,pages){
		res.render("index",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist,
			routePath : req.route.path,
			title : title
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'update_at' : 'desc'} };
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);

	User.findByName(username,function(err,user){
		if(err) return next(err);
		if(!user) return res.render('notice',{notice_msg:'用户不存在！'});
		query.author_id = user.id;
		
		Lib.getLibByQuery(query,options,function(err,liblist){
			if(err) return next(err);
			if(liblist && liblist.length>0){
				mainProxy.all('getCategory','getUser',function(category,user){
					proxy.emit('liblist',liblist);
				});
				
				mainProxy.after('category',liblist.length,function(list){
					mainProxy.emit('getCategory',list);
				});
				
				mainProxy.after('user',liblist.length,function(list){
					mainProxy.emit('getUser',list);
				});
				
				liblist.forEach(function(libItem){
					libItem.pubDate = util.format_date(libItem.create_at,true);
					libItem.summary = getSummary(libItem.content);
					
					Category.getCategoryById(libItem.category_id,function(err,category){
						if(err) return next(err);
						libItem.category = category;
						mainProxy.emit('category',category);
					});
					User.findById(libItem.author_id,function(err,user){
						if(err) return next(err);
						user.is_admin = config.admins[user.username];
						libItem.user = user;
						mainProxy.emit('user',user);
					});
				});
			}else{
				proxy.emit('liblist',[]);
			}
		});
		
		Lib.getCountByQuery(query,proxy.done(function (count) {
			var pages = Math.ceil(count / limit);
			proxy.emit('pages',{
				count:count,
				pages:pages
			});
		}));
	});
};

exports.showListForCategory = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = config.limit;
	var query = {isok:true};
	var catename = req.params.name;
	var title = ' 下的类库';

	if(req.query){ //页码参数处理
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
	}
	
	var render = function(liblist,pages){
		res.render("index",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist,
			routePath : req.route.path,
			title : title
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'update_at' : 'desc'} };
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);

	Category.findByEnName(catename,function(err,category){
		if(err) return next(err);
		if(!category) return res.render('notice',{notice_msg:'栏目不存在！'});
		title = category.name_cn+title;
		query.category_id = category.id;
		
		Lib.getLibByQuery(query,options,function(err,liblist){
			if(err) return next(err);
			if(liblist && liblist.length>0){
				mainProxy.all('getCategory','getUser',function(category,user){
					proxy.emit('liblist',liblist);
				});
				
				mainProxy.after('category',liblist.length,function(list){
					mainProxy.emit('getCategory',list);
				});
				
				mainProxy.after('user',liblist.length,function(list){
					mainProxy.emit('getUser',list);
				});
				
				liblist.forEach(function(libItem){
					libItem.pubDate = util.format_date(libItem.create_at,true);
					libItem.summary = getSummary(libItem.content);
					
					Category.getCategoryById(libItem.category_id,function(err,category){
						if(err) return next(err);
						libItem.category = category;
						mainProxy.emit('category',category);
					});
					User.findById(libItem.author_id,function(err,user){
						if(err) return next(err);
						user.is_admin = config.admins[user.username];
						libItem.user = user;
						mainProxy.emit('user',user);
					});
				});
			}else{
				proxy.emit('liblist',[]);
			}
		});
		
		Lib.getCountByQuery(query,proxy.done(function (count) {
			var pages = Math.ceil(count / limit);
			proxy.emit('pages',{
				count:count,
				pages:pages
			});
		}));
	});
};

exports.showListForTop = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = config.limit;
	var query = {top:true,isok:true};
	var title = '编辑推荐';

	if(req.query){ //页码参数处理
		var qsObj = {};
		extend(qsObj,req.query);
		delete qsObj.page;
		var qstr = querystring.stringify(qsObj);
		if(qstr){
			base+="?"+qstr;
		}
	}
	
	var render = function(liblist,pages){
		res.render("index",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist,
			routePath : req.route.path,
			title : title
		});
	};
	
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'update_at' : 'desc'} };
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);
	
	Lib.getLibByQuery(query,options,function(err,liblist){
		if(err) return next(err);
		if(liblist && liblist.length>0){
			mainProxy.all('getCategory','getUser',function(category,user){
				proxy.emit('liblist',liblist);
			});
			
			mainProxy.after('category',liblist.length,function(list){
				mainProxy.emit('getCategory',list);
			});
			
			mainProxy.after('user',liblist.length,function(list){
				mainProxy.emit('getUser',list);
			});
			
			liblist.forEach(function(libItem){
				libItem.pubDate = util.format_date(libItem.create_at,true);
				libItem.summary = getSummary(libItem.content);
				
				Category.getCategoryById(libItem.category_id,function(err,category){
					if(err) return next(err);
					libItem.category = category;
					mainProxy.emit('category',category);
				});
				User.findById(libItem.author_id,function(err,user){
					if(err) return next(err);
					user.is_admin = config.admins[user.username];
					libItem.user = user;
					mainProxy.emit('user',user);
				});
			});
		}else{
			proxy.emit('liblist',[]);
		}
	});
	
	Lib.getCountByQuery(query,proxy.done(function (count) {
		var pages = Math.ceil(count / limit);
		proxy.emit('pages',{
			count:count,
			pages:pages
		});
	}));
};

exports.getNew = function (req, res, next) {
	Lib.getLibFieldByQuery({},'_id libname title',{limit: 12, sort: {'update_at' : 'desc'}},function(err,liblist){
		if(err) return next(err);
		util.JSONPRes(req,res,{msg:'ok',liblist:liblist});
	});
};

exports.getTopView = function (req, res, next) {
	Lib.getLibFieldByQuery({},'_id libname title',{limit: 8, sort: {'visit_count' : 'desc'}},function(err,liblist){
		if(err) return next(err);
		successRes(res,{msg:'ok',liblist:liblist});
	});
};

exports.getTopUse = function (req, res, next) {
	Lib.getLibFieldByQuery({},'_id libname title',{limit: 8, sort: {'fav_count' : 'desc'}},function(err,liblist){
		if(err) return next(err);
		successRes(res,{msg:'ok',liblist:liblist});
	});
};

exports.getTopTag = function (req, res, next) {
	Tag.getTagByQuery({},{limit: 40, sort: {'topic_count' : 'desc'}},function(err,taglist){
		if(err) return next(err);
		successRes(res,{msg:'ok',taglist:taglist});
	});
};

exports.count = function (req, res, next) {
	Lib.getCountByQuery({},function(err,count){
		if(err) return next(err);
		successRes(res,{msg:'ok',count:count});
	});
};

exports.getBaseInfo = function(req, res, next){
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	
	mainProxy.all('getTopView','getTopUse','getTopTag','count',function(toplist,uselist,taglist,count){
		successRes(res,{msg:'ok',toplist:toplist,uselist:uselist,taglist:taglist,count:count});
	});
	
	Lib.getLibFieldByQuery({},'_id libname title',{limit: 8, sort: {'visit_count' : 'desc'}},mainProxy.done('getTopView'));
	Lib.getLibFieldByQuery({},'_id libname title',{limit: 8, sort: {'fav_count' : 'desc'}},mainProxy.done('getTopUse'));
	Tag.getTagByQuery({},{limit: 40, sort: {'topic_count' : 'desc'}},mainProxy.done('getTopTag'));
	Lib.getCountByQuery({},mainProxy.done('count'));
};

exports.tag = function (req, res, next) {
	Tag.getAllTag(function(err,taglist){
		if(err) return next(err);
		res.render('tag',{tag:taglist});
	});
};

exports.about = function (req, res, next) {
	res.render('about');
};

exports.getUserIp = function (req, res, next) {
	return successRes(res,JSON.stringify(getClientIp(req)));
};

function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for'); 
    if (forwardedIpsStr) {
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {
        ipAddress = req.connection.remoteAddress;
    }
	if (!ipAddress) {
        ipAddress = req.socket.remoteAddress;
    }
	if (!ipAddress) {
        ipAddress = req.ip;
    }
    return ipAddress;
};

var getNetworkIP = function () {
	var os=require('os');
	var ifaces=os.networkInterfaces();
	var ips = [];
	for (var dev in ifaces) {
		ifaces[dev].forEach(function(details){
			if (details.family=='IPv4') {
				ips.push(details.address);
			}
		});
	}
	return ips;
};

function getSummary(content){
	content = content.replace(/<[^>]*>|/g,""); //替换html标签
	var index = content.indexOf(config.pageSplite);
	if(index>-1){
		return content.substring(0,index);
	}else{
		return content;
	}
};

function extend(o, c){
    if(o && c && typeof c == "object"){
        for(var p in c){
            o[p] = c[p];
        }
    }
    return o;
};