var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var uuid = require('uuid')
var mustacheExpress = require('mustache-express');

const staticDir = __dirname + '/static';
const viewsDir = __dirname + '/views'
const host = process.argv[2] || 'localhost';
const port = process.argv[3] || 8000

console.log('Listening on ' + host + ':' + port)
server.listen(port, host);
// WARNING: app.listen(80) will NOT work here!

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache')
app.set('views', viewsDir)

app.get('/', function (req, res) {
  res.render('index', { 'host': host, 'port': port });
});

app.get('/app.js', function (req, res) {
  res.sendFile(staticDir + '/app.js');
});

app.get('/style.css', function (req, res) {
  res.sendFile(staticDir + '/style.css');
});

var players = {};
var redCount = 0;
var blueCount = 0;
var state = 'lobby';

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function assignTask(task, team) {
    var keys = Object.keys(players)
    var team_keys = [];
    keys.forEach(key => {
      if (players[key].team == team) {
        team_keys.push(key);
      }
    });
    shuffle(team_keys)
    var found = false;
    var foundBlue = false;
    for (i = 0; i < team_keys.length; i++) {
      if (!players[team_keys[i]].busy) {
        players[team_keys[i]].busy = true;
        players[team_keys[i]].socket.emit('task_generated', { 'task': task });
        found = true;
        break;
      }
    }
    if (!found) {
      console.log('Team ' + team + ' all busy!');
    }
};

function enterTeam(player, team) {
  player.team = team;
  changeTeamCounter(player, 1);
}

function leaveTeam(player) {
  changeTeamCounter(player, -1);
}

function changeTeamCounter(player, diff) {
  if (player.team == 'red') {
    redCount += diff;
  } else if (player.team == 'blue') {
    blueCount += diff;
  }
}

function onChangeTeam(data) {
  console.log('Changing team of player ' + data.id + ' to ' + data.team);
  if (data.team == "red" && redCount < 4) {
    leaveTeam(players[data.id]);
    enterTeam(players[data.id], 'red');
    players[data.id].socket.emit('team_changed', { 'team': 'red' });
  } else if (data.team == "blue" && blueCount < 2) {
    leaveTeam(players[data.id]);
    enterTeam(players[data.id], 'blue');
    players[data.id].socket.emit('team_changed', { 'team': 'blue' });
  } else if (data.team == "observer") {
    players[data.id].team = 'observer';
    players[data.id].socket.emit('team_changed', { 'team': 'observer' });
  } else {
    players[data.id].socket.emit('team_full', { 'team': data.team });
  }
}

function startGame() {
  state = 'game';
  Object.entries(players).forEach(entry => {
    let player = entry[1];
    player.socket.emit('game_started');
  })
}

function generateTask(data) {
  assignTask(null, 'red');
  assignTask(null, 'blue');
}

function finishTask(data) {
  players[data.id].busy = false;
}

io.on('connection', function (socket) {
  playerId = uuid.v4()
  players[playerId] = {'id': playerId, 'socket': socket, 'team': 'observer', 'busy': false };
  socket.emit('init', { id: playerId, 'team': players[playerId].team, 'state': state, 'busy': players[playerId].busy });
  socket.emit('team_changed', { 'team': 'observer' });
  socket.on('change_team', onChangeTeam);
  socket.on('start_game', startGame);
  socket.on('generate_task', generateTask);
  socket.on('finish_task', finishTask);
});
