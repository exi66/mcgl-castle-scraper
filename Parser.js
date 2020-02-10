const request = require('request-promise-native');
const fs = require("fs");
const cheerio = require('cheerio');
const Promises = require('bluebird');
//const promises = require('q');
const child_process = require('child_process');
const asyncExecCmd = require('async-exec-cmd')

const php = "PHPSESSID=na2l8enljtjk4dpitd9m4rm6i0"
const year = "2019";
const url = "https://forum.minecraft-galaxy.ru/fortresshistory/1322/"
const path = "clans/"

const localJar = request.jar();
localJar.setCookie(request.cookie(php), 'http://forum.minecraft-galaxy.ru');

var hrefs = [];


app();

async function app(){
	var chields = [];
	
	for (let i = 0; i<3; i++) {
		var _links = await get(i);
		var page = { 
			'page': i,
			'links': _links
		};
		hrefs.push(page);
	}
	console.log(hrefs);
	for (var href of hrefs) {
		var i = 0;
		for (var link of href.links) {
			console.log("link "+i+" start");
			child_process.execSync('start node --max-old-space-size=4096 ParserSupport.js '+link+" "+path);
			console.log("link "+i+" finish");
			i++;
		}
	}
}

async function get(i) {
	return new Promise(function(resolve, reject) {
		request({
			method: 'GET',
			url: url+i,
			jar: localJar,
			headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0'
			}
		}).then(body => {
			if (body !== '') {
				var links = [];
				var p = Promise.resolve();
				const $ = cheerio.load(body);
				console.log("page: "+i);
				 //substring(0,4);
				Promises
				.each($('tr').get(), function(elem){
					if ($(elem).find($('td.author-row')).first().text().substring(0,4) === year) {
						let href = $(elem).find($(`td.text-row:nth-child(2)`).find('a')).attr('href');
						links.push(href);
						//console.log(href);
					}
					//else console.log("Пропущен");
				})
				.then(function(){
					resolve(links);
				});	
			}
			else {
				console.log("Ошибка: тело ответа отсутствует. Автоматический выход.");
			}
		});	
	})
}