var fs = require('fs');

const KILL = "KILL";
const FLAG_DMG = "FLAG_DMG";
const FLAG_DESTR = "FLAG_DESTR";
const CAPTURE_START = "CAPTURE_START";
const CAPTURE_STOP = "CAPTURE_STOP";
const CAPTURED = "CAPTURED";

const args = process.argv.slice(2);
if (!args[0]) return console.error("Ошибка: отсутствуют обязательные аргументы <path>!");
const path = args[0];
app();

function app() {
	let all_clans_list = [], all_players_list = [], battlelog_list = [], pvp = 0, capture_time = 0;
	for (let f of getFiles(path)) {
		battlelog_list.push({
			name: f,
			events_list: JSON.parse(fs.readFileSync(f)),
			players_list: [],
			clans_list: []
		});
	}
	for (let local_battlelog of battlelog_list) {
		for (let local_event of local_battlelog.events_list) {
			if (local_event.player !== -1) {
				let local_player = findPlayerByID(parseInt(local_event.player, 10), local_battlelog.players_list);
				let local_clan = findClanByID(parseInt(local_event.clan, 10), local_battlelog.clans_list);
				if (local_player.clan == -1) local_player.clan = parseInt(local_event.clan, 10);
				if (local_event.type === KILL) {
					local_player.kills++;
					findPlayerByID(parseInt(local_event.data, 10),local_battlelog.players_list).deaths++;
				}
				if (local_event.type === FLAG_DMG) local_player.flag_dmg+=parseInt(local_event.data, 10);
				if (local_event.type === CAPTURE_STOP) local_player.capture_time+=parseInt(local_event.data, 10);
				if (local_event.text.includes("Попытка захвата: отмена, ")) {
					let data = local_event.text.substr(local_event.text.lastIndexOf(' ')+1);
					data = data.substr(0, data.length - 1);
					local_player.capture_time+=parseInt(local_event.data, 10);
				}
				if (local_event.type === CAPTURED){
					local_player.capture_time+=60;
					local_clan.captured++;
				}
			}
			else {
				if (local_event.type === CAPTURED){
					findClanByID(parseInt(local_event.clan, 10), local_battlelog.clans_list).captured++;
				}
			}			
		}
		for (let local_clan of local_battlelog.clans_list) {
			for (let local_player of local_battlelog.players_list) {
				if (local_player.clan === local_clan.id) {
					local_clan.members++;
					local_clan.kills 		+= local_player.kills;
					local_clan.deaths 		+= local_player.deaths;
					local_clan.flag_dmg 	+= local_player.flag_dmg;
					local_clan.capture_time += local_player.capture_time;
					local_clan.players.push(local_player);
				}				
			}			
		}
		for (let local_clan of local_battlelog.clans_list) {
			local_all_clan = findAllClan(local_clan, all_clans_list);
			local_all_clan.siege++;
			local_all_clan.members 			+= local_clan.members;
			local_all_clan.kills 			+= local_clan.kills;
			local_all_clan.deaths 			+= local_clan.deaths;
			local_all_clan.flag_dmg 		+= local_clan.flag_dmg;
			local_all_clan.capture_time 	+= local_clan.capture_time;
			local_all_clan.captured 		+= local_clan.captured;
			for (let local_player of local_clan.players) {
				let p = findPlayerByID(local_player.id, local_all_clan.players)
				p.kills 		+= local_player.kills;
				p.deaths 		+= local_player.deaths;
				p.flag_dmg 		+= local_player.flag_dmg;
				p.capture_time 	+= local_player.capture_time;
			}
		}
		for (let local_player of local_battlelog.players_list) {
			local_all_player = findAllPlayer(local_player, all_players_list);
			local_all_player.siege++;
			local_all_player.kills 			+= local_player.kills;
			local_all_player.deaths 		+= local_player.deaths;
			local_all_player.flag_dmg 		+= local_player.flag_dmg;
			local_all_player.capture_time 	+= local_player.capture_time;
		}
	}
	for(let clan of all_clans_list) {
		pvp+=clan.kills;
		capture_time+=clan.capture_time;
	}
	console.log("Осад: "			+battlelog_list.length);
	console.log("Игроков: "			+all_players_list.length);
	console.log("Кланов: "			+all_clans_list.length);
	console.log("PVP: "				+pvp);
	console.log("Время захвата: "	+capture_time);
	
	all_players_list.sort(Siege);
	printPlayers(all_players_list, 100);
	
	all_clans_list.sort(Captured);	
	printClans(all_clans_list, all_clans_list.length);
};

function getFiles(dir, files_){
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

function findPlayerByID(local_id, local_players_list){
	for (let player of local_players_list) {
		if (player.id == local_id) {
			return player;
		}			
	}
	local_players_list.push({
		id: local_id,
		kills: 0,
		deaths: 0,
		flag_dmg: 0,
		capture_time: 0,
		clan: -1
	});
	return (local_players_list[local_players_list.length-1]);
};

function findClanByID(local_id, local_clans_list){
	for (let clan of local_clans_list) {
		if (clan.id == local_id) {
			return clan;
		}			
	}
	local_clans_list.push({
		id: local_id,
		kills: 0,
		deaths: 0,
		flag_dmg: 0,
		capture_time: 0,
		members: 0,
		captured: 0,
		players: []
	});
	return (local_clans_list[local_clans_list.length-1]);	
}

function findAllPlayer(local_player, local_all_players_list) {
	for (let p of local_all_players_list) {
		if (p.id == local_player.id) {
			return p;
		}
	}
	local_all_players_list.push({
		id: local_player.id,
		siege: 0,
		kills: 0,
		deaths: 0,
		flag_dmg: 0,
		capture_time: 0,
		clan: local_player.clan
	});
	return (local_all_players_list[local_all_players_list.length-1]);
}

function findAllClan(local_clan, local_all_clans_list) {
	for (let c of local_all_clans_list) {
		if (c.id == local_clan.id) {
			return c;
		}
	}
	local_all_clans_list.push({
		id: local_clan.id,
		siege: 0,
		kills: 0,
		deaths: 0,
		flag_dmg: 0,
		capture_time: 0,
		members: 0,
		captured: 0,
		players: []
	});
	return (local_all_clans_list[local_all_clans_list.length-1]);
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
	let kda_a = (a.deaths === 0) ? a.kills : a.kills/a.deaths;
	let kda_b = (b.deaths === 0) ? b.kills : kda_b = b.kills/b.deaths;
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

function printClans(data, l) {
	console.log("[table]");
	console.log("Клан||Посещено осад||Убийств||Смертей||K/D||Время в захвате||Урон по флагу||Среднее кол-во людей||Захватов/удержаний");
	for (let i = 0; i < l; i++){
		let elem = data[i];
		let kda = (elem.deaths > 0) ? (elem.kills/elem.deaths).toFixed(2) : elem.kills+".00";
		console.log("[clan="+elem.id+"]|"+elem.siege+"|"+elem.kills+"|"+elem.deaths+"|"+kda+"|"+elem.capture_time+"|"+elem.flag_dmg+"|"+Math.floor(elem.members/elem.siege)+"|"+elem.captured);
	}
	console.log("[/table]");
}

function printPlayers(data, l) {
	console.log("[table]");
	console.log("Игрок||Посещено осад||Убийств||Смертей||K/D||Время в захвате||Урон по флагу");
	for (let i = 0; i < l; i++){
		let elem = data[i]; 
		let kda = (elem.deaths > 0) ? (elem.kills/elem.deaths).toFixed(2) : elem.kills+".00";
		console.log("[user="+elem.id+"][/user]|"+elem.siege+"|"+elem.kills+"|"+elem.deaths+"|"+kda+"|"+elem.capture_time+"|"+elem.flag_dmg);
	}
	console.log("[/table]");
}