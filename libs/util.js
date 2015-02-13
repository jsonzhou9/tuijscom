var xss = require('xss');

exports.format_date = function (date, friendly) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hour = date.getHours();
  var minute = date.getMinutes();
  var second = date.getSeconds();

  if (friendly) {
    var now = new Date();
    var mseconds = -(date.getTime() - now.getTime());
    var time_std = [ 1000, 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000 ];
    if (mseconds < time_std[3]) {
      if (mseconds > 0 && mseconds < time_std[1]) {
        return Math.floor(mseconds / time_std[0]).toString() + ' 秒前';
      }
      if (mseconds > time_std[1] && mseconds < time_std[2]) {
        return Math.floor(mseconds / time_std[1]).toString() + ' 分钟前';
      }
      if (mseconds > time_std[2]) {
        return Math.floor(mseconds / time_std[2]).toString() + ' 小时前';
      }
    }
  }

  //month = ((month < 10) ? '0' : '') + month;
  //day = ((day < 10) ? '0' : '') + day;
  hour = ((hour < 10) ? '0' : '') + hour;
  minute = ((minute < 10) ? '0' : '') + minute;
  second = ((second < 10) ? '0': '') + second;

  var thisYear = new Date().getFullYear();
  year = (thisYear === year) ? '' : (year + '-');
  return year + month + '-' + day + ' ' + hour + ':' + minute;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

exports.escape = function (html) {
  var codeSpan = /(^|[^\\])(`+)([^\r]*?[^`])\2(?!`)/gm;
  var codeBlock = /(?:\n\n|^)((?:(?:[ ]{4}|\t).*\n+)+)(\n*[ ]{0,3}[^ \t\n]|(?=~0))/g;
  var spans = [];
  var blocks = [];
  var text = String(html).replace(/\r\n/g, '\n')
  .replace('/\r/g', '\n');

  text = '\n\n' + text + '\n\n';

  text = text.replace(codeSpan, function (code) {
    spans.push(code);
    return '`span`';
  });

  text += '~0';

  return text.replace(codeBlock, function (whole, code, nextChar) {
    blocks.push(code);
    return '\n\tblock' + nextChar;
  })
  .replace(/&(?!\w+;)/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/`span`/g, function () {
    return spans.shift();
  })
  .replace(/\n\tblock/g, function () {
    return blocks.shift();
  })
  .replace(/~0$/, '')
  .replace(/^\n\n/, '')
  .replace(/\n\n$/, '');
};

/**
 * XSS模块配置
 */
var xssOptions = {
  whiteList: {
    h1:     [],
    h2:     [],
    h3:     [],
    h4:     [],
    h5:     [],
    h6:     [],
    hr:     [],
    span:   [],
    strong: [],
    b:      [],
    i:      [],
    br:     [],
    p:      [],
    pre:    ['class'],
    code:   [],
    a:      ['target', 'href', 'title'],
    img:    ['src', 'alt', 'title'],
    div:    [],
    table:  ['width', 'border'],
    tr:     [],
    td:     ['width', 'colspan'],
    th:     ['width', 'colspan'],
    tbody:  [],
    thead:  [],
    ul:     [],
    li:     [],
    ol:     [],
    dl:     [],
    dt:     [],
    em:     [],
    cite:   [],
    section: [],
    header: [],
    footer: [],
    blockquote: [],
    audio:  ['autoplay', 'controls', 'loop', 'preload', 'src'],
    video:  ['autoplay', 'controls', 'loop', 'preload', 'src', 'height', 'width']
  }
};

/**
 * 过滤XSS攻击代码
 *
 * @param {string} html
 * @return {string}
 */
exports.xss = function (html) {
  return xss(html, xssOptions);
};

function extend(o, c){
    if(o && c && typeof c == "object"){
        for(var p in c){
            o[p] = c[p];
        }
    }
    return o;
};

/**
 * JSON数据格式统一
 */
function JSONPRes(req,res,data){
	var callback = req.query && req.query.callback;
	var dataStr = JSON.stringify(data);
	if(callback){
		if(/^[a-zA-Z0-9_]+$/.test(callback)){
			return res.send(callback+'('+dataStr+')');
		}else{
			return JSONRes(res,-1,'callback只能包含字母和数字！');
		}
	}else{
		return JSONRes(res,-1,'缺少callback参数！');
	}
};

function JSONRes(res,type,data){
	var resJSON = {result:type,msg:""};
	if(typeof data == "object"){
		extend(resJSON,data);
	}else{
		resJSON.msg = data;
	}
	res.json(resJSON);
};
exports.JSONPRes = JSONPRes;
exports.failRes = function(res,data){
	return JSONRes(res,-1,data);
};
exports.successRes = function(res,data){
	return JSONRes(res,0,data);
};