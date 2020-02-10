var fs = require('fs');
var path = require('path');


const KILL = "KILL";
const FLAG_DMG = "FLAG_DMG";
const FLAG_DESTR = "FLAG_DESTR";
const CAPTURE_START = "CAPTURE_START";
const CAPTURE_STOP = "CAPTURE_STOP";
const CAPTURED = "CAPTURED";

function getFiles (dir, files_){
    
  files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
};

function app() {
	var all_clans = [];
	var all_players = [];
	var logs = [];
	var files_clans = getFiles('clans/');	
	var files_team = getFiles('team/');
	var files = files_clans.concat(files_team);
	for (file of files){
		var _event = {
			name: file,
			event_list: [],
			players: [],
			clans: []
		};
		logs.push(_event);
	}
	//console.log(logs);
	for (var log of logs) {
		var json = fs.readFileSync(log.name);
		log.event_list = JSON.parse(json);
	}
	for (var i=0; i<logs.length; i++) {
		for (var _event of logs[i].event_list){
			if (_event.player !== -1) {
				if (findClanByID(_event.clan, logs[i]) === -1) {
					var _clan = {
						id: _event.clan,
						kills: 0,
						deaths: 0,
						flag_dmg: 0,
						capture_time: 0,
						members: 0,
						captured: 0
					}
					logs[i].clans.push(_clan);
				}
				
				if (findPlayerByID(_event.player, logs[i]) === -1){
					var _player = {
						id: _event.player,
						kills: 0,
						deaths: 0,
						flag_dmg: 0,
						capture_time: 0,
						clan: _event.clan,
					}
					//console.log(_player);
					logs[i].players.push(_player);
				}
				if (_event.type === KILL) {
					if (findPlayer(_event.player, logs[i])) {
						findPlayerByID(_event.player, logs[i]).kills++;
					}
					if (findPlayerByID(_event.data, logs[i]) !== -1) {
						findPlayerByID(_event.data, logs[i]).deaths++;
					}
				}
				if (_event.type === FLAG_DMG) {
					if (findPlayer(_event.player, logs[i])) {
						findPlayerByID(_event.player, logs[i]).flag_dmg+=parseInt(_event.data, 10);
					}
				}
				if (_event.type === CAPTURE_STOP) {
					if (findPlayer(_event.player, logs[i])) {
						findPlayerByID(_event.player, logs[i]).capture_time+=(_event.data, 10);
					}
				}
				if (_event.type === CAPTURED && _event.text === "Попытка захвата: захватил"){
					if (findPlayer(_event.player, logs[i])) {
						findPlayerByID(_event.player, logs[i]).capture_time+=60;
					}	
				}
			}
			else {
				if (_event.text === "Захват" || _event.text === "Захват (удержание)") {
					findClanByID(_event.clan, logs[i]).captured++;
				}
			}
		}
		for (clan of logs[i].clans) {
			for (player of logs[i].players) {
				if (player.clan === clan.id) {
					clan.members++;
					clan.kills+=player.kills;
					clan.deaths+=player.deaths;
					clan.flag_dmg+=player.flag_dmg;
					clan.capture_time+=player.capture_time;
				}
			}
		}
		//console.log(logs[i].clans);
		for (player of logs[i].players) {
			if (findALLPlayer(player.id, all_players) === -1) {
				var _player = {
					id: player.id,
					kills: player.kills,
					deaths: player.deaths,
					flag_dmg: player.flag_dmg,
					capture_time: player.capture_time,
					siege: 1
				}
				all_players.push(_player);
			}
			else {
				findALLPlayer(player.id, all_players).kills+=player.kills;
				findALLPlayer(player.id, all_players).deaths+=player.deaths;
				findALLPlayer(player.id, all_players).flag_dmg+=player.flag_dmg;
				findALLPlayer(player.id, all_players).capture_time+=player.capture_time;
				findALLPlayer(player.id, all_players).siege++;
			}
		}
		for (clan of logs[i].clans) {
			if (findALLClan(clan.id, all_clans) === -1) {
				var _clan = {
					id: clan.id,
					kills: clan.kills,
					deaths: clan.deaths,
					flag_dmg: clan.flag_dmg,
					capture_time: clan.capture_time,
					members: clan.members,
					siege: 1,
					captured: clan.captured
					
				}
				all_clans.push(_clan);
			}
			else {
				findALLClan(clan.id, all_clans).kills+=clan.kills;
				findALLClan(clan.id, all_clans).deaths+=clan.deaths;
				findALLClan(clan.id, all_clans).flag_dmg+=clan.flag_dmg;
				findALLClan(clan.id, all_clans).capture_time+=clan.capture_time;
				findALLClan(clan.id, all_clans).members+=clan.members;
				findALLClan(clan.id, all_clans).siege++;
				findALLClan(clan.id, all_clans).captured+=clan.captured;
			}
		}
	}
	console.log(all_clans);
	console.log(all_players);
	//console.log(logs);
	console.log("Осад: "+logs.length);
	console.log("Игроков: "+all_players.length);
	console.log("Кланов: "+all_clans.length);
	var pvp = 0;
	var capture_time = 0;
	for(clan of all_clans) {
		pvp+=clan.kills;
		capture_time+=clan.capture_time;
	}
	console.log("PVP: "+pvp);
	console.log("Время захвата: "+capture_time);
	all_clans.sort(Flags);
	PrintClan(all_clans);
};

function findPlayer(id, log){
	if (log.players.length > 0) {
		for (var player of log.players) {
			if (player.id == id) {
				return true;
			}			
		}
		return false;
	}
	else return false;
};

function findPlayerByID(id, _log){
	if (_log.players.length > 0) {
		for (var player of _log.players) {
			if (player.id == id) {
				return player;
			}			
		}
		return -1;
	}
	else return -1;
};

function findClanByID(id, _log){
	if (_log.clans.length > 0) {
		for (var clan of _log.clans) {
			if (clan.id == id) {
				return clan;
			}			
		}
		return -1;
	}
	else return -1;
}

function findALLPlayer(id, all_players) {
	if (all_players.length > 0) {
		for (var player of all_players) {
			if (player.id == id) {
				return player;
			}
		}
		return -1
	}
	else return -1;
}

function findALLClan(id, all_clans) {
	if (all_clans.length > 0) {
		for (var clan of all_clans) {
			if (clan.id == id) {
				return clan;
			}
		}
		return -1;
	}
	else return -1;	
}

function Kills(a, b) {
  if (a.kills > b.kills) return -1;
  if (b.kills > a.kills) return 1;
  return 0;
}

function Deaths(a, b) {
  if (a.deaths > b.deaths) return -1;
  if (b.deaths > a.deaths) return 1;
  return 0;
}

function KDA(a, b) {
	if (a.deaths === 0) var kda_a = a.kills;
	else var kda_a = a.kills/a.deaths
	if (b.deaths === 0) var kda_b = b.kills;
	else var kda_b = b.kills/b.deaths;
  if (kda_a > kda_b) return -1;
  if (kda_b > kda_a) return 1;
  return 0;
}

function Flags(a, b) {
  if (a.flag_dmg > b.flag_dmg ) return -1;
  if (b.flag_dmg  > a.flag_dmg ) return 1;
  return 0;
}

function Siege(a, b) {
  if (a.siege > b.siege ) return -1;
  if (b.siege  > a.siege ) return 1;
  return 0;
}

function Capture(a, b) {
  if (a.capture_time > b.capture_time ) return -1;
  if (b.capture_time  > a.capture_time ) return 1;
  return 0;
}

function Captured(a, b) {
  if (a.captured > b.captured ) return -1;
  if (b.captured  > a.captured ) return 1;
  return 0;
}

function AverageMembers(a, b) {
  if (a.members/a.siege > b.members/b.siege) return -1;
  if (b.members/b.siege  > a.members/a.siege) return 1;
  return 0;
}
function PrintClan(data) {
	console.log("[table]");
	console.log("Клан||Посещено осад||Убийств||Смертей||K/D||Время в захвате||Урон по флагу||Среднее кол-во людей||Захватов/удержаний");
	for (var elem of data){
		var kda;
		if (elem.deaths > 0) kda = (elem.kills/elem.deaths).toFixed(2);
		else kda = elem.kills+".00"
		console.log("[clan="+elem.id+"]|"+elem.siege+"|"+elem.kills+"|"+elem.deaths+"|"+kda+"|"+elem.capture_time+"|"+elem.flag_dmg+"|"+Math.floor(elem.members/elem.siege)+"|"+elem.captured);
	}
	console.log("[/table]");
}
function PrintPlayer(data) {
	console.log("[table]");
	console.log("Игрок||Посещено осад||Убийств||Смертей||K/D||Время в захвате||Урон по флагу");
	for (var i=0; i<data.length; i++){
		var elem = data[i]; 
		var kda;
		if (elem.deaths > 0) kda = (elem.kills/elem.deaths).toFixed(2);
		else kda = elem.kills+".00";
		console.log("[user="+elem.id+"][/user]|"+elem.siege+"|"+elem.kills+"|"+elem.deaths+"|"+kda+"|"+elem.capture_time+"|"+elem.flag_dmg);
	}
	console.log("[/table]");
}


app();