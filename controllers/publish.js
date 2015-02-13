/*
 * 发布类库模块
 */
var check = require('validator').check,
    sanitize = require('validator').sanitize;
var Category = require("../models_extend").Category;
var config = require('../config').config;
var util = require('../libs/util');
var EventProxy = require('eventproxy');
var Lib = require("../models_extend").Lib;
var Tag = require("../models_extend").Tag;
var LibTag = require("../models_extend").LibTag;
var LibUser = require("../models_extend").LibUser;
var LibUse = require("../models_extend").LibUse;
var User = require("../models_extend").User;
var failRes = util.failRes;
var successRes = util.successRes;
var pagedown = require("pagedown");

var mongoose = require('mongoose');

/**
 * 类库前台展示
 */
exports.showLib= function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	var safeConverter = pagedown.getSanitizingConverter();
	var id = req.params.id;
	try{
		id = new mongoose.Types.ObjectId(id);
	}catch(e){
		return res.render('notice',{notice_msg:e.message});
	}
	var libData = {};
	var description = '';//页面描述
	
	var render = function(category, tag, user){
		user.is_admin = config.admins[user.username]; //作者是否是管理员
		
		if(!libData.isok && (!req.session.user || !req.session.user.is_admin || req.session.user.username!=user.username) ){ //未审核且非管理员及作者本人
			return res.render('notice',{notice_msg:'该内容未审核，禁止查看！'});
		}
		
		res.render("showlib",{
			lib : libData,
			category : category,
			tag : tag,
			user : user,
			description : description,
			is_admin : req.session.user && req.session.user.is_admin //是否是管理员登录
		});
	};
	
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('category', 'tag', 'user', render);
	proxy.fail(next);
	
	Lib.getLibById(id,function(err,lib){
		if(!lib || err) return res.render('notice',{notice_msg:'ID错误，数据库无此记录！'});
		lib.visit_count += 1;
		lib.save();
		
		libData = lib;
		libData.pubDate = util.format_date(lib.create_at,true);
		libData.contentHtml = safeConverter.makeHtml(lib.content.replace(config.pageSplite,''));
		libData.contentHtml = libData.contentHtml.replace(/<pre>/gi,'<pre class="brush: js;">');//for代码高亮
		libData.contentHtml = libData.contentHtml.replace(/src="\//g,'src="'+config.cdn_list[config.currCDN]);//统一cdn链接
		description = getSummary(lib.content);
		
		var category_id = lib.category_id;
		var lib_id = lib._id;
		var author_id = lib.author_id;
		
		//查栏目
		Category.getCategoryById(category_id,proxy.done('category'));
		
		//查tag
		LibTag.getByLibId(lib_id,function(err,libtag){
			if(libtag && libtag.length>0){
				mainProxy.after('libtag', libtag.length, function(list){
					proxy.emit('tag',list);
				});
				
				libtag.forEach(function(libtagItem){
					Tag.getTagById(libtagItem.tag_id,mainProxy.done('libtag'));
				});
			}else{
				proxy.emit('tag',[]);
			}
		});
		
		//查用户
		User.findById(author_id,proxy.done('user'));
	});
}

/**
 * 我的收藏
 */
exports.showFavor = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = 12;
	var user_id = req.session.user.id;
	var options = { skip: (page - 1) * limit, limit: limit };
	
	var render = function(liblist,pages){
		res.render("my_favor",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist
		});
	};
	
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);
	
	LibUser.getLibByQuery({user_id:user_id}, options, function(err,liblist){
		if(err)return next(err);
		
		if(liblist && liblist.length>0){
			mainProxy.after('getLibList',liblist.length,function(list){
				proxy.emit('liblist',list);
			});
			
			liblist.forEach(function(liblistItem){
				Lib.getLibById(liblistItem.lib_id,mainProxy.done('getLibList'));
			});
		}else{
			proxy.emit('liblist',[]);
		}
	});
	
	LibUser.getCountByQuery({user_id:user_id},proxy.done(function (count) {
    	var pages = Math.ceil(count / limit);
    	proxy.emit('pages',{
			count:count,
			pages:pages
		});
  	}));
};

/**
 * 取消收藏
 */
exports.delFavor = function (req, res, next) {
	var user_id = req.session.user.id;
	var lib_id = req.body.lib_id;
	LibUser.findByLibAndUserRemove(lib_id,user_id,function(err){
		if(err)return next(err);
		return successRes(res,'取消收藏成功！');
	});
};

/**
 * 类库审核
 */
exports.showLibAudit = function (req, res, next) {
	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = 12;
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'create_at' : 'desc'} };
	
	var render = function(liblist,pages){
		res.render("admin_lib",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist
		});
	};
	
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);
	
	Lib.getLibByQuery({isok:false},options,proxy.done('liblist'));
	
	Lib.getCountByQuery({isok:false},proxy.done(function (count) {
    	var pages = Math.ceil(count / limit);
    	proxy.emit('pages',{
			count:count,
			pages:pages
		});
  	}));
};


/**
 * 我的发布
 */
exports.showMyPublish = function (req, res, next) {
	var base = req.route.path;
	var page = parseInt(req.query.page, 10) || 1;
	var limit = 12;
	var author_id = req.session.user.id;
	var options = { skip: (page - 1) * limit, limit: limit, sort: {'create_at' : 'desc'} };
	
	var render = function(liblist,pages){
		res.render("my_publish",{
			base : base,
			limit : limit,
			current_page: page,
			pages : pages.pages,
			count : pages.count,
			liblist : liblist
		});
	};
	
	var proxy = EventProxy.create('liblist', 'pages', render);
	proxy.fail(next);
	
	Lib.getLibByQuery({author_id:author_id},options,proxy.done('liblist'));
	
	Lib.getCountByQuery({author_id:author_id},proxy.done(function (count) {
    	var pages = Math.ceil(count / limit);
    	proxy.emit('pages',{
			count:count,
			pages:pages
		});
  	}));
};

/**
 * 发布类库
 */
exports.showPublish = function (req, res, next) {
	var id = req.query && req.query.id || 0;

	if(req.route && req.route.path){
		res.locals.routePath = req.route.path;
	}
	
	var render = function(category, tag, lib){
		category = category || [];
		tag = tag || [];
		lib = lib || {};
		res.render('publish',{columns:category, tag:tag.join(","), libData:lib});
	};
	
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('category', 'tag', 'lib', render);
	proxy.fail(next);
	
	Category.getCategoryByQuery({},{},proxy.done('category'));
	
	if(!id){ //新增
		proxy.emit('tag',[]);
		proxy.emit('lib',{});
	}else{ //修改
		try{
			id = new mongoose.Types.ObjectId(id);
		}catch(e){
			return res.render('notice',{notice_msg:e.message});
		}

		Lib.getLibById(id,proxy.done('lib',function(lib){
			if(!lib) return res.render('notice',{notice_msg:'ID错误，数据库无此记录！'});
			return lib;
		}));
		
		//查询类库对标签列表
		LibTag.getByLibId(id,function(err,libtag){
			if(libtag && libtag.length>0){
				mainProxy.after('libtag', libtag.length, function(tag){
					var tagNameArr = [];
					tag.forEach(function(tagItem){
						tagNameArr.push(tagItem.name);
					});
					proxy.emit('tag',tagNameArr);
				});
				
				libtag.forEach(function(libtagItem){
					Tag.getTagById(libtagItem.tag_id,mainProxy.done('libtag'));
				});
			}else{
				proxy.emit('tag',[]);
			}
		});
	}
};
//保存类库
exports.saveLib = function (req, res, next) {
	var id = req.body.id;
	try{
		id = new mongoose.Types.ObjectId(id);
	}catch(e){
		id = false;
	}

	var category_id = req.body.category_id;
		//category_id = new mongoose.Types.ObjectId(category_id);
	var category_type = sanitize(req.body.category_type).toInt();
	var top = sanitize(req.body.top).toBoolean();
	
	var doc = sanitize(req.body.doc).trim();
	var github = sanitize(req.body.github).trim();
	var homepage = sanitize(req.body.homepage).trim();
	var thumb = sanitize(req.body.thumb).trim();
	
	var content = req.body.content;
		content = util.xss(content);
	var libname = sanitize(req.body.libname).trim();
		libname = util.escape(libname);
	var tag = sanitize(req.body.tag).trim();
		tag = tag.replace(/，/g,",");
		tag = util.escape(tag);
	var tags = tag && tag.split(",") || []; //标签数组
	var title = sanitize(req.body.title).trim();
		title = util.escape(title);
		
	var author_id = req.session.user.id;
	var isok = false; //审核是否通过
	
	if(!author_id){
		return failRes(res,'请重新登录后再试！');
	}
	
	//验证
	try {
		check(title, '推荐标题为空或长度不在10-64字符之间！').len(10, 64);
	} catch (e) {
		return failRes(res,e.message);
	}
	
	if(category_type){ //category_type==1为类库
		try {
			check(libname, '类库名称为空或长度不在4-32字符之间！').len(4, 32);
		} catch (e) {
			return failRes(res,e.message);
		}
	}
	
	if(github){
		var github_tem = github.replace(/[\-\_\/\.]/g,'');
		try {
			check(github_tem, 'github含有非法字符，只支持字母数字及斜杠！').isAlphanumeric(); //字母数字
		} catch (e) {
			return failRes(res,e.message);
		}
	}
	if(homepage){
		try {
			check(homepage, '类库主页必须要是一个网址！').isUrl();
		} catch (e) {
			return failRes(res,e.message);
		}
	}
	if(doc){
		try {
			check(doc, '类库文档必须要是一个网址！').isUrl();
		} catch (e) {
			return failRes(res,e.message);
		}
	}
	/*if(thumb){
		try {
			check(thumb, '缩略图链接必须要是一个网址！').isUrl();
		} catch (e) {
			return failRes(res,e.message);
		}
	}*/
	//普通用户，不能设置推荐和标签，且不能编辑
	if(!req.session.user || !req.session.user.is_admin){
		tag = "";
		top = false;
		if(id){
			return failRes(res,'只有管理员才能编辑内容！');
		}
	}
	//管理员
	if(req.session.user && req.session.user.is_admin){
		isok = true;
	}
	
	//所有数据库操作已结束
	var allEnd = function(lib_id){
		successRes(res,{msg:'类库保存成功！',lib_id:lib_id});
	};
	
	//保存类库
	var libSave = function(){
		if(!id){ //新增
			Lib.newAndSave(category_id, top, doc, github, homepage, content, libname, title, author_id, isok, thumb, proxy.done('lib'));
		}else{ //编辑
			Lib.findByIdAndUpdate(id,{
				category_id : category_id,
				top : top,
				doc : doc,
				github : github,
				homepage : homepage,
				content : content,
				libname : libname,
				title : title,
				update_at : new Date,
				isok : true,
				thumb : thumb
			},proxy.done('lib'));
		}
	};
	
	//更新标签数量
	var updataTag = function(tag,offset,callback){
		mainProxy.after('tagnum',tag.length,function(list){
			return callback();
		});
		
		tag.forEach(function(tag_id){
			Tag.getTagById(tag_id, mainProxy.done('tagnum',function (tag) {
				if(offset>0){
					tag.topic_count += 1;
				}else{
					tag.topic_count -= 1;
				}
				tag.save();
			}));
		});
	};
	
	//更新tag的数量并保存libtag
	var libtagSaveEnd = function(tag,lib){
		var lib_id = lib._id;

		if(tag && tag.length>0){
			mainProxy.after('libtag',tag.length,function(list){
				updataTag(tag,1,function(){
					return allEnd(lib_id);
				});
			});
			
			tag.forEach(function(tag_id){
				LibTag.newAndSave(lib_id, tag_id, mainProxy.done('libtag'));
			});
		}else{
			return allEnd(lib_id);
		}
	};

	//类库和tag已保存
	var saveEnd = function(tag,lib){
		var lib_id = lib._id;
		
		if(id){ //编辑
			//编辑前，清掉libtag，减少tag的数量
			var editForTag = function(){
				libtagSaveEnd(tag,lib);
			};
			
			mainProxy.all('tagUp','libtagDel',editForTag);

			//更新tag数量
			LibTag.getByLibId(lib_id,function(err,libtagDoc){
				//删除libtag
				LibTag.findByLibRemove(lib_id,mainProxy.done('libtagDel'));
				
				if(libtagDoc && libtagDoc.length>0){
					var tagidArr = [];
					libtagDoc.forEach(function(libtagItem){
						tagidArr.push(libtagItem.tag_id);
					});
					
					updataTag(tagidArr,-1,function(){
						mainProxy.emit('tagUp');
					});
				}else{
					mainProxy.emit('tagUp');	
				}
			});
		}else{
			libtagSaveEnd(tag,lib);
		}
	};
	
	//事件代理
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('tag', 'lib', saveEnd);
	proxy.fail(next);
	
	//保存标签
	if(tag){
		//需要保存的标签，保存完毕
		mainProxy.after('tagSave',tags.length,function(list){
			var saveId = [];
			list.forEach(function(listItem){
				saveId.push(listItem._id);
			});
			proxy.emit('tag', saveId);						   
		});	
		
		//查询需要保存的标签并保存，防止重复
		mainProxy.after('getTag',tags.length,function(list){
			var saveCount = 0;

			list.forEach(function(listItem){
				if(!listItem.db){
					saveCount++;
					Tag.newAndSave(listItem.name, mainProxy.done('tagSave'));
				}else{
					mainProxy.emit('tagSave',listItem.db);
				}
			});
			
			if(saveCount==0){ //没有要保存的
				proxy.emit('tag', []);
			}
		});
		
		tags.forEach(function(name){
			Tag.getTagByName(name,mainProxy.done('getTag',function(tag){
				return {db:tag,name:name};
			}));
		});
	}else{
		proxy.emit('tag', []);
	}
	
	if(category_type && !id){ //category_type==1为类库且为新增时，判断是否重名类库
		Lib.getLibByName(libname,function(err,lib){
			if(lib){
				return failRes(res,'已存在同名类库，请勿重复添加！');
			}
			libSave();
		});
	}else{
		libSave();
	}
};

/**
 * 删除类库
 */
exports.libDel = function (req, res, next) {
	var lib_id = req.body.lib_id;
	
	var allEnd = function(){
		return successRes(res,'类库成功删除！');
	};
	
	//更新标签数量
	var updataTag = function(tag,offset,callback){
		mainProxy.after('tagnum',tag.length,function(list){
			return callback();
		});
		
		tag.forEach(function(tag_id){
			Tag.getTagById(tag_id, mainProxy.done('tagnum',function (tag) {
				if(offset>0){
					tag.topic_count += 1;
				}else{
					tag.topic_count -= 1;
				}
				tag.save();
			}));
		});
	};
	
	var mainProxy = new EventProxy();
	mainProxy.fail(next);
	var proxy = EventProxy.create('lib', 'lib_tag', 'lib_use', 'lib_user', 'tag', allEnd);
	proxy.fail(next);
	
	Lib.findByIdAndRemove(lib_id,proxy.done('lib'));
	LibUse.findByLibRemove(lib_id,proxy.done('lib_use'));
	LibUser.findByLibRemove(lib_id,proxy.done('lib_user'));
	
	//更新tag数量
	LibTag.getByLibId(lib_id,function(err,libtagDoc){
		//删除libtag
		LibTag.findByLibRemove(lib_id,proxy.done('lib_tag'));
		
		if(libtagDoc && libtagDoc.length>0){
			var tagidArr = [];
			libtagDoc.forEach(function(libtagItem){
				tagidArr.push(libtagItem.tag_id);
			});
			
			updataTag(tagidArr,-1,function(){
				proxy.emit('tag');	
			});
		}else{
			proxy.emit('lib_tag');	
		}
	});
};


/**
 * 审核通过
 */
exports.libAuditOn = function (req, res, next) {
	var lib_id = req.body.lib_id;
	Lib.findByIdAndUpdate(lib_id,{isok:true},function(err){
		if(err)return next(err);
		return successRes(res,'审核通过！');
	});
};

/**
 * 取消审核
 */
exports.libAuditOff = function (req, res, next) {
	var lib_id = req.body.lib_id;
	Lib.findByIdAndUpdate(lib_id,{isok:false},function(err){
		if(err)return next(err);
		return successRes(res,'已成功取消审核！');
	});
};

/**
 * 添加收藏
 */
exports.favAdd= function (req, res, next) {
	var lib_id = req.body.lib_id;
	var user_id = req.session.user.id;
	try{
		lib_id = new mongoose.Types.ObjectId(lib_id);
	}catch(e){
		return failRes(res,e.message);
	}
	
	LibUser.getByLibAndUser(lib_id,user_id,function(err,doc){
		if(err)return next(err);
		if(!doc){
			LibUser.newAndSave(lib_id,user_id,function(err,doc){
				if(err)return next(err);
				return successRes(res,'收藏成功！');
			});
		}else{
			return failRes(res,'您已收藏过！');
		}
	});
}

/**
 * 添加喜爱值/已使用过
 */
exports.useCountAdd= function (req, res, next) {
	var lib_id = req.body.lib_id;
	var ip = getClientIp(req);
	
	LibUse.getCountByQuery({lib_id:lib_id, user_ip:ip},function(err,count){
		if(err)return next(err);
		
		if(count>0){
			return failRes(res,"您的IP已提交过，请不要重复添加！");
		}else{
			Lib.getLibById(lib_id,function(err,lib){
				if(err)return next(err);
				lib.fav_count += 1;
				lib.save(function(){
					LibUse.newAndSave(lib_id,ip,function(err){
						return successRes(res,{msg:'ok',count:lib.fav_count});
					});
				});
			});
		}
	});
};

/**
 * 链接跳转管理
 */
exports.libGo= function (req, res, next) {
	var id = req.query.id;
	var type = req.query.type;

	Lib.getLibById(id,function(err,lib){
		if(err) return next(err);
		res.redirect(lib[type]);
	});
};

//是否重名
exports.isRepeat = function (req, res, next) {
	var libname = req.query && req.query.libname || "";
	if(libname){
		libname = libname;
		Lib.getLibByName(libname,function(err,lib){
			if(err){
				return next(err);
			}
			if(lib){
				return failRes(res,"已存在同名类库，请勿重复添加！");
			}else{
				return successRes(res,"无重复库！");
			}
		});
	}else{
		return failRes(res,"参数错误！");
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

function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.header('x-forwarded-for') || req.headers['x-real-ip']; 
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
    return ipAddress;
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