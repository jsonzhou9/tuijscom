/*
 * 配置文件
 */
var path = require('path');

exports.config = {
	name : "tuijs",
	version : "0.1.0",
	website_name : "推JS",
	website_slogan : "优质开源JS类库框架推荐",
	kewords : "推JS,推即时,开源JS,JS类库,JS框架,tuijs,前端框架,前端类库",
	description : "优质开源JS类库框架推荐网站,前端类库框架推荐",
	resVersion : "20140202",
	
	//管理员列表
	admins : {'admin':true},
	adminEmail : "admin@tuijs.com",
	
	//密钥
	session_secret : "",
	sbuyid : "",
	auth_cookie_name : "",
	
	//数据库
	db_name : "",
	db_host :  "",
	db_port :  "",
	username : "",
	password : "",
	
	//qiniu
	QINIU_ACCESS_KEY : "",
	QINIU_SECRET_KEY : "",
	
	cdn_list :{
		'qiniu' : 'http://tuijs.u.qiniudn.com/'
	},
	currCDN : 'qiniu',
	
	//列表页显示数目
	limit : 12,
	pageSplite : '&lt;!--more--&gt;', //摘要分割符
	
	// 限制发帖时间间隔，单位：毫秒
	post_interval : 10000
};