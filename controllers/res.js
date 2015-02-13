/*
 * 资源管理
 */
var models = require("../models_extend");
var config = require('../config').config;
var util = require('../libs/util');
var Lib = models.Lib;
var EventProxy = require('eventproxy');
var failRes = util.failRes;
var successRes = util.successRes;
var qiniu = require('qiniu');
var fs = require('fs');
var ResModel = require("../models_extend").Res;

qiniu.conf.ACCESS_KEY = config.QINIU_ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.QINIU_SECRET_KEY;

exports.upload = function (req, res, next) {
	if(!(req.files && req.files.pic))return failRes(res,'参数不正确！');
	
	//获得文件的临时路径
    var tmp_path = req.files.pic.path;
	var key = req.files.pic.path; //用临时路径生成的文件名当key
	var extra = new qiniu.io.PutExtra();
	var uptoken = getUptoken('tuijs');
	
	qiniu.io.putFile(uptoken, key, tmp_path, extra, function(err, ret) {
		//删除临时文件
		fs.unlink(tmp_path);
		
		if(err){
			failRes(res,ret);
		}else{
			ResModel.newAndSave(key,function(err,doc){
				if(err) return next(err);
				
				successRes(res,ret);
			});
		}
	});
};

function getUptoken(bucketname) {
	var putPolicy = new qiniu.rs.PutPolicy(bucketname);
	return putPolicy.token();
}

function getRandomNum(){
	var time = (+new Date);
	var randomNum = Math.floor(Math.random()*1000); //3位随机数
	return time+"_"+randomNum;
}

function newGuid(){
    var guid = "";
    for (var i = 1; i <= 32; i++){
		var n = Math.floor(Math.random()*16.0).toString(16);
		guid += n;
		if((i==8)||(i==12)||(i==16)||(i==20)){
			guid += "-";
		}
    }
    return guid;    
}