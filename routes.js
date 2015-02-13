/*
 * all routes所有路由控制
 */

var site = require('./controllers/site');
var sign = require('./controllers/sign');
var admin = require('./controllers/admin');
var publish = require('./controllers/publish');
var res = require('./controllers/res');
var auth = require('./midderwares/auth');

module.exports = function(app) {
	app.get('/', site.index);
	app.get('/tag', site.tag);
	app.get('/top_view', site.getTopView);
	app.get('/top_use', site.getTopUse);
	app.get('/top_tag', site.getTopTag);
	app.get('/newlist', site.getNew);
	app.get('/top', site.showListForTop);
	app.get('/tag/:name', site.showListForTag);
	app.get('/user/:name', site.showListForUser);
	app.get('/category/:name', site.showListForCategory);
	app.get('/about', site.about);
	app.get('/count', site.count);
	app.get('/userip', site.getUserIp);
	app.get('/base_info',site.getBaseInfo);
	
	app.post('/upload', auth.adminRequired, res.upload);
	
	app.get('/lib/:id', publish.showLib);
	app.get('/libgo', publish.libGo);
	
	app.get('/login', sign.showlogin);
	app.post('/login', sign.login);
	app.get('/loginout', sign.signout);
	app.get('/register', sign.showreg);
	app.post('/register', sign.register);
	app.get('/password', auth.userRequired, sign.showPassword);
	
	app.get('/column', auth.adminRequired, admin.showColumn);
	app.post('/column', auth.adminRequiredJSON, auth.tokenRequiredJSON, admin.saveColumn);
	app.get('/hide_column', auth.adminRequiredJSON, auth.tokenRequiredJSON, admin.hideColumn);
	app.get('/del_column', auth.adminRequiredJSON, auth.tokenRequiredJSON, admin.delColumn);
	app.get('/restore_column', auth.adminRequiredJSON, auth.tokenRequiredJSON, admin.restoreDelColumn);
	
	app.get('/admin_user', auth.adminRequired, admin.showAdminUser);
	app.get('/lock_user', auth.adminRequired, auth.tokenRequiredJSON, admin.lockUser);
	app.get('/unlock_user', auth.adminRequired, auth.tokenRequiredJSON, admin.unlockUser);
	app.get('/view_user', auth.adminRequired, auth.tokenRequiredJSON, admin.viewUser);
	
	app.get('/publish', auth.userRequired, publish.showPublish);
	app.get('/isrepeat_publish', auth.userRequired, auth.tokenRequired, publish.isRepeat); //查询类库名称是否被占用
	app.post('/publish', auth.userRequiredJSON, auth.tokenRequiredJSON, publish.saveLib); //发布类库
	app.post('/fav_add', auth.userRequiredJSON, auth.tokenRequiredJSON, publish.favAdd); //添加收藏
	app.post('/use_add', publish.useCountAdd); //使用量增加
	app.post('/audit_on', auth.adminRequiredJSON, auth.tokenRequiredJSON, publish.libAuditOn); //审核通过
	app.post('/audit_off', auth.adminRequiredJSON, auth.tokenRequiredJSON, publish.libAuditOff); //取消审核
	app.post('/lib_del', auth.adminRequiredJSON, auth.tokenRequiredJSON, publish.libDel); //删除类库
	app.get('/admin_lib', auth.adminRequired, publish.showLibAudit);
	
	app.get('/my_publish', auth.userRequired, publish.showMyPublish);
	app.get('/favor', auth.userRequired, publish.showFavor);
	app.post('/userfav_del', auth.userRequiredJSON, publish.delFavor);
};