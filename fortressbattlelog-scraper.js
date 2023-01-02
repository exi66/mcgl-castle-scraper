const request = require('request-promise-native');
const fs = require('fs');

const KILL = 'KILL';
const FLAG_DMG = 'FLAG_DMG';
const FLAG_DESTR = 'FLAG_DESTR';
const CAPTURE_START = 'CAPTURE_START';
const CAPTURE_STOP = 'CAPTURE_STOP';
const CAPTURED = 'CAPTURED';

const args = process.argv.slice(2);
const php = args[0];
const href = args[1];
const path = args[2];
const localJar = request.jar();
localJar.setCookie(request.cookie('PHPSESSID='+php), 'http://forum.minecraft-galaxy.ru');

console.log('--------------------------------');
console.log(href);
console.log('-----------EVENT-LOG------------');
request({
	method: 'GET',
	url: 'https://forum.minecraft-galaxy.ru'+href,
	jar: localJar,
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0'
	}
}).then(body => {
	if (body !== '') {	
		let events = [];
		let json_name = href.substring(19);
		let flag = true;
		let table = body.match(/<tr[\s\S]*?<\/tr>/g);
		for (let i = 1; i < table.length; i++) {
			if (flag) {
				let _event = {'date':'', 'player':'', 'clan':'', 'text':'text', 'type':'', 'data':''};
				_event.date = table[i].match('[0-9]{4}([\-/ \.])[0-9]{2}[\-/ \.][0-9]{2}[\ / \.][0-9]{2}[\:/ \.][0-9]{2}[\:/ \.][0-9]{2}')[0];
				try {
					_event.player = table[i].match(/\b(href=\'\/profilemain\/)[0-9]+/gm)[0].substring(19);
				} catch (e) {
					_event.player = -1;
				}
				try {
					_event.clan = table[i].match(/\b(href=\'\/claninfo\/)[0-9]+/gm)[0].substring(16);
				} catch (e) {
					_event.clan = -1;
				} 
				let type = table[i].match('<td class=\'text-row\'>(.*?)</td>')[1];
				_event.text = type;
				if (type.includes('Урон по флагу')) {
					_event.type = FLAG_DMG;
					let data = type.substr(type.lastIndexOf(' ')+1);
					data = data.substr(0, data.length - 3);
					_event.data = data;
				}
				else if (type.includes('Игрок убит:')) {
					_event.type = KILL;
					_event.data = type.match(/\b(href=\'\/profilemain\/)[0-9]+/gm)[0].substring(19);
				}
				else if (type.includes('Попытка захвата: начал')) {
					_event.type = CAPTURE_START;
				}
				else if (type.includes('Попытка захвата: отмена')) {
					_event.type = CAPTURE_STOP;
					let data;
					try {
						data = type.substr(type.lastIndexOf(' ')+1);
						data = data.substr(0, data.length - 1);
					} catch(e) { data = -1 };
					_event.data = data;									
				}
				else if (type.includes('Уничтожен флаг'))  {
					_event.type = FLAG_DESTR;
				}
				else if ((type.includes('Попытка захвата: захватил')) || (type.includes('Захват (удержание)'))) {
					_event.type = CAPTURED;
				}
				else {
					_event.type = 'NONE';
					_event.data = 'NONE';
				}
				if (_event.type === CAPTURED) {
					flag = false;
				}
				console.log(_event);
				events.push(_event);
			}
		}
		console.log('-----------EVENT-LOG-END--------');
		fs.writeFile (path+json_name+'.json', JSON.stringify(events), function(err) {
			if (err) return console.error(err.message);
			console.log(json_name+' сохранен');
			console.log('--------------------------------');
		});
	}
	else {
		console.error('Ошибка: тело ответа отсутствует. Автоматический выход.');
	}
});
