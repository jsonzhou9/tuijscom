/**
 * jQuery.cookie
 */
(function($) {
    $.cookie = function () {
        var opts = {
            path: false,
            domain: false,
            duration: false,
            secure: false,
            document: document
        };
        var set_options = function (options) {
            options = options || {};
            for (var o in opts) {
                if (!options[o]) {
                    options[o] = opts[o];
                }
            }
            return options;
        };
        var write = function (key, value, options) {
            options = set_options(options);

            if (options.domain) value += '; domain=' + options.domain;
            if (options.path) value += '; path=' + options.path;
            if (options.duration) {
                var date = new Date();
                date.setTime(date.getTime() + options.duration * 24 * 60 * 60 * 1000);
                value += '; expires=' + date.toGMTString();
            }
            if (options.secure) value += '; secure';
            options.document.cookie = key + '=' + value;
        };
        var read = function (key) {
            var options = set_options();
            var value = options.document.cookie.match('(?:^|;)\\s*' + key.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1') + '=([^;]*)');
            return (value) ? decodeURIComponent(value[1]) : null;
        };
        var clear = function (key, options) {
            var options = set_options(options);
            options.duration = -1;
            write(key, '', options);
        };
        return {
            'write': write,
            'read': read,
            'clear': clear
        };
    }();
})(jQuery);

/**
 *工具类
 */
var $Util = {
	getUrlArgs:function(_name,_url){
		var url = _url || window.location.href;
		if(new RegExp(".*\\b"+_name+"\\b(\\s*=([^&]+)).*", "gi").test(url)){
			return RegExp.$2;
		}else{
			return "";
		}
	},
	Ajax : function(type,url,data,callback,errcb){
		$.ajax({
			type: type,
			url: url,
			dataType: "json",
			data:data,
			success:function(json){
				if(json.result==0){
					if(callback){
						callback(json);
					}else{
						$UI.showNoteMsg(json.msg,"success");
						window.location.reload();
					}
				}else{
					if(errcb){
						errcb(json);
					}else{
						$UI.showNoteMsg(json.msg,"warn");
					}
				}
			},
			error:function(e){
				$UI.showNoteMsg("系统繁忙，请刷新后重试！","warn");
			},
			complete:function(){
				if($("a[name=msg]").size()>0){
					location.hash = "#msg";
				}
				
				if($(".btn_loading").size()>0){
					$(".btn_loading").hide();
				}
			}
		});
	},
	GET : function(url,data,callback,errcb){
		this.Ajax("GET",url,data,callback,errcb);
	},
	POST : function(url,data,callback,errcb){
		this.Ajax("POST",url,data,callback,errcb);
	},
	getToken : function(){
		if(!$.cookie.read("tkey"))return 0;
		var hash = 5381, str = $.cookie.read("tkey").substring(0,10);
		for (var i = 0, len = str.length; i < len; ++i) {
			hash += (hash << 5) + str.charCodeAt(i);
		}
		return hash & 0x7fffffff;
	},
	extend : function (o, c){
		if(o && c && typeof c == "object"){
			for(var p in c){
				o[p] = c[p];
			}
		}
		return o;
	}
};

/*
 * UI管理总类
 */
var $UI = (function(){
	var msgTypeList = {
		"warn" : "nWarning",
		"success" : "nSuccess",
		"fail" : "nFailure",
		"info" : "nInformation"
	};
	
	function initPage(){
		var pageHeight = $(document).height();
		if($("#nav").size()>0){
			$("#nav").height(pageHeight);
		}
	};
	
	function formError(input,msg){
		var $input = $(input);
		hideFormError(input);
		$input.after('<span class="error"><b></b>'+msg+'</span>');
	};
	
	function hideFormError(input){
		var $input = $(input);
		if($input.next("span").size()>0){
			$input.next("span").remove();
		}
	};
	
	function showNoteMsg(msg,type){
		var _type = type ? msgTypeList[type] : msgTypeList["info"];
		if($("#noteMsg").size()>0){
			$("#noteMsg").attr("class","nNote "+_type);
			$("#noteMsg").find("p").html(msg);
			$("#noteMsg").show();
		}
	};
	
	/* scroll to top */
	function totop_button(a) {
		var b = $("#totop");
		b.removeClass("off on");
		if (a == "on") { b.addClass("on") } else { b.addClass("off") }
	}
	
	function initToTop(){
		window.setInterval(function () {
			var b = $(document).scrollTop();
			var c = $(document).height();
			if (b > 0) { var d = b + c / 2 } else { var d = 1 }
			if (d < 1e3) { totop_button("off") } else { totop_button("on") }
		}, 300);
		
		$("#totop").click(function (e) {
			e.preventDefault();
			$('body,html').animate({scrollTop:0},{duration:500});
		});
	}
	
	function initRight(){
		/*$Util.GET("/top_view",{},function(json){
			var list = [];
			for(var i=0;i<json.liblist.length;i++){
				var libTitle = json.liblist[i].libname ? json.liblist[i].title+'：'+json.liblist[i].libname :json.liblist[i].title;
				list.push('<li> › <a href="/lib/'+json.liblist[i]._id+'">'+libTitle+'</a></li>');
			}
			$("#top_view").html(list.join(''));
		},function(json){
			$("#top_view").html(json.msg);
		});
		
		$Util.GET("/top_use",{},function(json){
			var list = [];
			for(var i=0;i<json.liblist.length;i++){
				var libTitle = json.liblist[i].libname ? json.liblist[i].title+'：'+json.liblist[i].libname :json.liblist[i].title;
				list.push('<li> › <a href="/lib/'+json.liblist[i]._id+'">'+libTitle+'</a></li>');
			}
			$("#top_use").html(list.join(''));
		},function(json){
			$("#top_use").html(json.msg);
		});
		
		$Util.GET("/top_tag",{},function(json){
			var list = [];
			for(var i=0;i<json.taglist.length;i++){
				list.push('<a href="/tag/'+encodeURIComponent(json.taglist[i].name)+'">'+json.taglist[i].name+'</a>');
			}
			$("#top_tag").html(list.join(''));
		},function(json){
			$("#top_tag").html(json.msg);
		});
		
		$Util.GET("/count",{},function(json){
			var count = json.count.toString();
			while(count.length<4){
				count = "0"+count;
			}
			$(".libnum-num").html(count);
		},function(json){
			
		});*/
		
		$Util.GET("/base_info",{},function(json){
			//最多查看
			var list = [];
			for(var i=0;i<json.toplist.length;i++){
				var libTitle = json.toplist[i].libname ? json.toplist[i].title+'：'+json.toplist[i].libname :json.toplist[i].title;
				list.push('<li> › <a href="/lib/'+json.toplist[i]._id+'">'+libTitle+'</a></li>');
			}
			$("#top_view").html(list.join(''));
			
			//最多使用
			var uselist = [];
			for(var i=0;i<json.uselist.length;i++){
				var libTitle = json.uselist[i].libname ? json.uselist[i].title+'：'+json.uselist[i].libname :json.uselist[i].title;
				uselist.push('<li> › <a href="/lib/'+json.uselist[i]._id+'">'+libTitle+'</a></li>');
			}
			$("#top_use").html(uselist.join(''));
			
			//标签
			var taglist = [];
			for(var i=0;i<json.taglist.length;i++){
				taglist.push('<a href="/tag/'+encodeURIComponent(json.taglist[i].name)+'">'+json.taglist[i].name+'</a>');
			}
			$("#top_tag").html(taglist.join(''));
			
			//统计量
			var count = json.count.toString();
			while(count.length<4){
				count = "0"+count;
			}
			$(".libnum-num").html(count);
		},function(json){});
	};
	
	return {
		initToTop : initToTop,
		initPage : initPage,
		formError : formError,
		showNoteMsg : showNoteMsg,
		hideFormError : hideFormError,
		initRight : initRight
	}
})();

/*
 * 栏目管理
 */
var $Column = (function(){
	function addEvent(){
		$("#column-form button").bind("click",function(){
			submitForm();
		});
		
		//彻底删除
		$("#column_list .btn-inverse").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/del_column",{id : id});
			}
		});
		
		//删除
		$("#column_list .btn-danger").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/hide_column",{id : id});
			}
		});
		
		//恢复
		$("#column_list .btn-success").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/restore_column",{id : id});
			}
		});
		
		//修改
		$("#column_list .btn-primary").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				var parentTr = $(this).parent().parent();
				$("#column-form input[name=id]").val(id);
				$("#column-form input[name=name_cn]").val(parentTr.find("td").eq(0).html());
				$("#column-form input[name=name_en]").val(parentTr.find("td").eq(1).html());
				$("#column-form select[name=type]").val(parentTr.find("td").eq(2).attr("data-type"));
			}
		});
	};
	
	function submitForm(){
		$Util.POST("/column",{
			id : $("#column-form input[name=id]").val(),
			type : $("#column-form select[name=type]").val(),
			name_cn : $("#column-form input[name=name_cn]").val(),
			name_en : $("#column-form input[name=name_en]").val()
		});
	};
	
	return {
		init : addEvent
	};
})();

/**
 * 用户管理
 */
var $UserAdmin = (function(){
	function addEvent(){
		//封号
		$("#admin_user_list .btn-danger").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/lock_user",{id : id});
			}
		});
		
		//解封
		$("#admin_user_list .btn-success").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/unlock_user",{id : id});
			}
		});
		
		//查看用户信息
		$("#admin_user_list .btn-info").bind("click",function(){
			var id = $(this).attr("data-id");
			if(id){
				$Util.GET("/view_user",{id : id},function(json){
					for(name in json){
						if($("#user_info #user_"+name).size()>0){
							$("#user_info #user_"+name).html(json[name]);
						}
					}
					$("#user_info header").html(json.username+"的用户信息");
					$("#user_info").show();
				});
			}
		});
	};
	
	return {
		init : addEvent
	};
})();

/*
 * 用户登录
 */
var $UserLogin = (function(){
	var msgList = {
		reg_success : "恭喜您注册成功，请登录！（已发送激活邮件至您的邮箱，请从邮箱激活！）",
		login_required : "登录后才能进行以下操作！",
		admin_required : "管理员才能进行以下操作！",
		token_error : "token错误，请确认后再试！"
	};
	var errFlag = [1,1];
	
	function addEvent(){
		$("#user-login-form input[name=loginname]").bind("blur",function(){
			var loginname = sanitize($(this).val()).trim();
			loginname = loginname.toLowerCase();
			errFlag[0] = 0;
			$UI.hideFormError(this);
			try {
				check(loginname, '用户名或邮箱错误！').len(5, 20);
			} catch (e) {
				errFlag[0] = 1;
				$UI.formError(this,e.message);
				return;
			}
		});
		
		$("#user-login-form input[name=password]").bind("blur",function(){
			var password = sanitize($(this).val()).trim();
			errFlag[1] = 0;
			$UI.hideFormError(this);
			try {
				check(password, '密码长度必须在8~16之间！').len(8, 16);
			} catch (e) {
				errFlag[1] = 1;
				$UI.formError(this,e.message);
				return;
			}
		});
		
		$("#user-login-form button").bind("click",function(){
			$("#user-login-form input[name=loginname]").blur();
			$("#user-login-form input[name=password]").blur();
			
			if(errFlag.join("")!="00"){
				$UI.showNoteMsg("您输入的信息还有错误，请检查后重试！","warn");
				return;
			}else{
				submitForm();
			}
		});
	};
	
	function submitForm(){
		var password = sanitize($("#user-login-form input[name=password]").val()).trim();
		password = md5(password);
		$Util.POST("/login",{
			loginname : $("#user-login-form input[name=loginname]").val(),
			password : password
		},function(json){
			$UI.showNoteMsg(json.msg,"success");
			window.location.href = json.url;
		});
	};
	
	function init(){
		var msg = $Util.getUrlArgs("msg");
		if(msg && msgList[msg]){
			window.location.hash = "#";
			var type = "warn";
			if(msg=="reg_success"){
				type = "success";
			}
			$UI.showNoteMsg(msgList[msg],type);
		}
		addEvent();
	};
	
	return {
		init : init
	};
})();

/*
 * 用户注册
 */
var $UserReg = (function(){
	var errFlag = [1,1,1];
	
	function addEvent(){
		$("#user-reg-form input[name=email]").bind("blur",function(){
			var email = sanitize($(this).val()).trim();
			email = email.toLowerCase();
			errFlag[0] = 0;
			$UI.hideFormError(this);
			try {
				check(email, 'Email地址为空或错误！').len(6, 64).isEmail();
			} catch (e) {
				errFlag[0] = 1;
				$UI.formError(this,e.message);
				return;
			}
		});
		$("#user-reg-form input[name=username]").bind("blur",function(){
			var username = sanitize($(this).val()).trim();
			username = username.toLowerCase();
			errFlag[1] = 0;
			$UI.hideFormError(this);
			try {
				check(username, '用户名只能为字母和数字且长度为5~20！').len(5, 20).isAlphanumeric();
			} catch (e) {
				errFlag[1] = 1;
				$UI.formError(this,e.message);
				return;
			}
		});
		$("#user-reg-form input[name=password]").bind("blur",function(){
			var password = sanitize($(this).val()).trim();
			errFlag[2] = 0;
			$UI.hideFormError(this);
			try {
				check(password, '密码长度必须在8~16之间！').len(8, 16);
			} catch (e) {
				errFlag[2] = 1;
				$UI.formError(this,e.message);
				return;
			}
		});
		$("#user-reg-form button").bind("click",function(){
			$("#user-reg-form input[name=email]").blur();
			$("#user-reg-form input[name=username]").blur();
			$("#user-reg-form input[name=password]").blur();
			
			if(errFlag.join("")!="000"){
				$UI.showNoteMsg("您输入的信息还有错误，请检查后重试！","warn");
				return;
			}else{
				submitForm();
			}
		});
	};
	
	function submitForm(){
		var password = sanitize($("#user-reg-form input[name=password]").val()).trim();
		password = md5(password);
		
		$Util.POST("/register",{
			email : $("#user-reg-form input[name=email]").val(),
			username : $("#user-reg-form input[name=username]").val(),
			password : password
		},function(json){
			$UI.showNoteMsg(json.msg,"success");
			window.location.href = "/login#msg=reg_success";
		});
	};
	
	function init(){
		addEvent();
	};
	
	return {
		init : init
	};
})();

var $Publish = (function(){
	var converter,editor;
	var loader = {
		show : function(){
			$(".btn_loading").show();
		},
		hide : function(){
			$(".btn_loading").hide();
		}
	};
	
	function addEvent(){
		$(".publish-form select[name=category]").bind("change",function(){
			var value = $(this).find("option:selected").attr("data-type");
			var allLibShow = $(".publish-form .lib-show");
			if(value==0){
				for(var i=0;i<allLibShow.size();i++){
					allLibShow.eq(i).hide();
				}
			}else{
				for(var i=0;i<allLibShow.size();i++){
					allLibShow.eq(i).show();
				}
			}
		});
		
		$(".publish-form input[name=libname]").bind("blur",function(){
			var libname = sanitize($(this).val()).trim();
			var me = this;
			$UI.hideFormError(this);
			try {
				check(libname, '类库名称为空或长度不在4-32字符之间！').len(4, 32);
			} catch (e) {
				$UI.formError(this,e.message);
				return;
			}
		});
		
		$(".publish-form input[name=title]").bind("blur",function(){
			var title = sanitize($(this).val()).trim();
			$UI.hideFormError(this);
			try {
				check(title, '推荐标题为空或长度不在10-64字符之间！').len(10, 64);
			} catch (e) {
				$UI.formError(this,e.message);
				return;
			}
		});
		
		$(".publish-form .btn-primary").bind("click",function(){
			$(".publish-form input[name=libname]").blur();
			$(".publish-form input[name=title]").blur();
			
			submitForm();
		});
		
		$('#file_upload').uploadify({
			'uploader' : '/upload',
			'auto' : true,
			'multi' : false,
			'buttonText' : '选择文件',
			'file_post_name' : 'pic',
			'onUploadSuccess' : function(efile, data, response){
				var res = JSON.parse(data);
				if(res.key){
					$("#file_url").val(res.key);
				}
			}
		});
	};
	
	function submitForm(){
		var formData = {
			id : $(".publish-form input[name=id]").val() || 0,
			category_id : $(".publish-form select[name=category]").val(),
			category_type : $(".publish-form select[name=category] option:selected").attr("data-type"),
			top : $(".publish-form input[name=top]:checked").val(),
			content : $("#wmd-input").val()
		}
		var input = $(".publish-form input[type=text]");
		for(var i=0;i<input.size();i++){
			formData[input.eq(i).attr("name")] = input.eq(i).val();
		}
		
		loader.show();
		$Util.POST("/publish",formData,function(json){
			$UI.showNoteMsg(json.msg,"success");
			if(json.lib_id){
				window.location.href = "/lib/"+json.lib_id;
			}else{
				window.location.href = "/my_publish#msg=publish_success";
			}
		});
	};
	
	function init(){
		try{
			converter = Markdown.getSanitizingConverter();
			editor = new Markdown.Editor(converter);
			editor.run();
			
			addEvent();
		}catch(e){}
	};
	
	return {
		init : init
	}
})();

var $Lib = (function(){
	function addEvent(){
		$("#fav_btn").click(function(){
			$Util.POST("/fav_add",{lib_id:$(this).attr("data-id")},function(json){
				$("#fav_btn").html("已收藏");
			});
		});
		$("#use_btn").click(function(){
			$Util.POST("/use_add",{lib_id:$(this).attr("data-id")},function(json){
				$("#use_btn").html("已使用 +"+json.count);
			});
		});
		$("#audit_btn").click(function(){
			$Util.POST("/audit_on",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
		$("#audit_off_btn").click(function(){
			$Util.POST("/audit_off",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
		$("#del_btn").click(function(){
			$Util.POST("/lib_del",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
	};
	
	function init(){
		addEvent();
		try{
			SyntaxHighlighter.config.clipboardSwf = 'http://cdn.tuijs.com/syntaxhighlighter/Scripts/clipboard.swf';
			SyntaxHighlighter.config.stripBrs = true;
			SyntaxHighlighter.all();
		}catch(e){
		}
	};
	
	return {
		init : init
	};
})();

var $Favor = (function(){
	function addEvent(){
		$("#userfav_del").on('click','.btn-danger',function(){
			$Util.POST("/userfav_del",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
	};
	
	return {
		init : addEvent
	};
})();

var $AdminLib = (function(){
	function addEvent(){
		$("#audit_list").on('click','.btn-success',function(){
			$Util.POST("/audit_on",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
		$("#audit_list").on('click','.btn-danger',function(){
			$Util.POST("/lib_del",{lib_id:$(this).attr("data-id")},function(json){
				window.location.reload();
			});
		});
	};
	
	return {
		init : addEvent
	};
})();

$(function(){
	//设置统一的token，防止csrf
	$.ajaxSetup({
		data:{_token:$Util.getToken()}
	});
	
	$UI.initToTop();
	$UI.initPage();
	$UI.initRight();
	
	//私有模块
	if($PATH){
		if($PATH=="/register"){
			$UserReg.init();
		}else if($PATH=="/login"){
			$UserLogin.init();
		}else if($PATH=="/column"){
			$Column.init();
		}else if($PATH=="/admin_user"){
			$UserAdmin.init();
		}else if($PATH=="/publish"){
			$Publish.init();
		}else if($PATH=="/lib/:id"){
			$Lib.init();
		}else if($PATH=="/favor"){
			$Favor.init();
		}else if($PATH=="/admin_lib"){
			$AdminLib.init();
		}
	}
});