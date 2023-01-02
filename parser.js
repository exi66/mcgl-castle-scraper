const request = require('request-promise-native');
const fs = require('fs');
const cheerio = require('cheerio');
const Promises = require('bluebird');
const child_process = require('child_process');

const args = process.argv.slice(2);
if (!args[0] || !args[1]) return console.error('Ошибка: отсутствуют обязательные аргументы <php> <url>!');
const php = args[0];
const url = (args[1].endsWith('\/')) ? args[1] : args[1] + '\/';
const pages = parseInt(args[2]) || 3;
const year = args[3] || new Date().getFullYear().toString();
const path = args[4] || './result/';
const scraper_support = 'fortressbattlelog-scraper.js';
const localJar = request.jar();
localJar.setCookie(request.cookie('PHPSESSID=' + php), 'http://forum.minecraft-galaxy.ru');

let hrefs_list = [];
if (!fs.existsSync(path)) {
	fs.mkdirSync(path);
}
app();

async function app() {
	console.log('PHPSESSID: ' + php);
	console.log('Ссылка на крепость: ' + url);
	console.log('Кол-во страниц: ' + pages);
	console.log('Год: ' + year);
	console.log('Путь сохранения: ' + path);
	console.log('--------------------------------');
	console.log('Сканирование страниц.');
	for (let i = 0; i < pages; i++) {
		let links_list = await get(i);
		console.log(links_list);
		hrefs_list.push({
			'page': i,
			'links': links_list
		});
	}
	console.log('Все страницы просканированы.');
	console.log('--------------------------------');
	console.log('Старт fortressbattlelog скраппера.');
	console.log('--------------------------------');
	for (let href of hrefs_list) {
		console.log('Страница #' + href.page);
		for (let i = 0; i < href.links.length; i++) {
			console.log(' - Ссылка: ' + href.links[i] + ' начало работы.');
			child_process.execSync(`start node ${scraper_support} ${php} ${href.links[i]} ${(path.endsWith('\/')) ? path : path + '\/'}`);
			console.log('   - Ссылка ' + href.links[i] + ' сохранена.');
		}
	}
}

async function get(i) {
	return new Promise(function (resolve, reject) {
		request({
			method: 'GET',
			url: url + i,
			jar: localJar,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0'
			}
		}).then(body => {
			if (body !== '') {
				var links = [];
				var p = Promise.resolve();
				const $ = cheerio.load(body);
				console.log('Page #' + i);
				Promises
					.each($('tr').get(), function (elem) {
						if ($(elem).find($('td.author-row')).first().text().substring(0, 4) === year) {
							let href = $(elem).find($(`td.text-row:nth-child(2)`).find('a')).attr('href');
							try {
								if (fs.existsSync((path.endsWith('\/')) ? path + href.substring(19) + '.json' : path + '\/' + href.substring(19) + '.json')) console.log(' - Этот fortressbattlelog уже существует!');
								else links.push(href);
							} catch (err) {
								console.error(err.message)
							}
						}
					})
					.then(function () {
						resolve(links);
					});
			}
			else {
				console.error('Ошибка: тело ответа отсутствует. Автоматический выход.');
			}
		});
	})
}
