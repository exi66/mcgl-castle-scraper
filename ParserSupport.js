const request = require('request-promise-native');
const fs = require("fs");
const cheerio = require('cheerio');
const Promises = require('bluebird');

const php = "PHPSESSID=na2l8enljtjk4dpitd9m4rm6i0"
const year = "2019";
const localJar = request.jar();
localJar.setCookie(request.cookie(php), 'http://forum.minecraft-galaxy.ru');

const KILL = "KILL";
const FLAG_DMG = "FLAG_DMG";
const FLAG_DESTR = "FLAG_DESTR";
const CAPTURE_START = "CAPTURE_START";
const CAPTURE_STOP = "CAPTURE_STOP";
const CAPTURED = "CAPTURED";

var myArgs = process.argv.slice(2);
var href = myArgs[0];
var path = myArgs[1];

console.log(href);
request({
	method: 'GET',
	url: "https://forum.minecraft-galaxy.ru"+href,
	jar: localJar,
	headers: {
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0'
	}
}).then(body => {
	if (body !== '') {	
		let events = [];
		let json_name = href.substring(19);
		var flag = true;
		const $ = cheerio.load(body, { decodeEntities: true }); //str.substr(13);
		Promises
		.each($('tr').not(':first-child').get(), function(elem) {
			if (flag) {
			let _event = {"date":"", "player":"", "clan":"", "text":"text", "type":"", "data":""};
			_event.date = $(elem).find($('td.author-row')).first().text();
			try {
				_event.player = $(elem).find($(`td.author-row:nth-child(2)`).find($('a'))).attr('href').substr(13);
			} catch(e) {
				_event.player = -1;
			}
			_event.clan = $(elem).find($('span.clan-link').find($('a'))).attr('href').substr(10);
			let type = $(elem).find($('td.text-row')).first().html().trim();
			_event.text = $(elem).find($('td.text-row')).first().text().trim();
			if (type.includes("&#x423;&#x440;&#x43E;&#x43D; &#x43F;&#x43E; &#x444;&#x43B;&#x430;&#x433;&#x443;")) {
				_event.type = FLAG_DMG;
				let data = type.substr(type.lastIndexOf(' ')+1);
				data = data.substr(0, data.length - 3);
				_event.data = data;
			}
			else if (type.includes("&#x418;&#x433;&#x440;&#x43E;&#x43A; &#x443;&#x431;&#x438;&#x442;:")) {
				_event.type = KILL;
				_event.data = $(elem).find($('td.text-row').find($('a'))).attr('href').substr(13);
			}
			else if (type.includes("&#x41F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x430; &#x437;&#x430;&#x445;&#x432;&#x430;&#x442;&#x430;: &#x43D;&#x430;&#x447;&#x430;&#x43B;")) {
				_event.type = CAPTURE_START;
			}
			else if (type.includes("&#x41F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x430; &#x437;&#x430;&#x445;&#x432;&#x430;&#x442;&#x430;: &#x43E;&#x442;&#x43C;&#x435;&#x43D;&#x430;")) {
				_event.type = CAPTURE_STOP;
				let data = type.substr(type.lastIndexOf(' ')+1);
				data = data.substr(0, data.length - 1);
				_event.data = data;									
			}
			else if (type.includes("&#x423;&#x43D;&#x438;&#x447;&#x442;&#x43E;&#x436;&#x435;&#x43D; &#x444;&#x43B;&#x430;&#x433;"))  {
				_event.type = FLAG_DESTR;
			}
			else if ((type.includes("&#x41F;&#x43E;&#x43F;&#x44B;&#x442;&#x43A;&#x430; &#x437;&#x430;&#x445;&#x432;&#x430;&#x442;&#x430;: &#x437;&#x430;&#x445;&#x432;&#x430;&#x442;&#x438;&#x43B;")) || (type.includes("&#x417;&#x430;&#x445;&#x432;&#x430;&#x442; (&#x443;&#x434;&#x435;&#x440;&#x436;&#x430;&#x43D;&#x438;&#x435;)"))) {
				_event.type = CAPTURED;
			}
			else {
				_event.type = "NONE";
				_event.data = "NONE";
			}
			if (_event.type === CAPTURED) {
				flag = false;
			}
				console.log(_event);
				events.push(_event);
			}
		})
		.then(function(){ 
			fs.writeFile (path+json_name+".json", JSON.stringify(events), function(err) {
				if (err) throw err;
				console.log(json_name+' saved');
			});
			
		});
	}
	else {
		console.log("Ошибка: тело ответа отсутствует. Автоматический выход.");
	}
});