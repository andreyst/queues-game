localStorage.debug = 'socket.io-parser,socket.io-client:socket';
var socket = io.connect('http://' + host + ':' + port);

var id;
var team;
var gameState;

function payload(payload) {
  payload.id = id;
  return payload;
}

function showLobby() {
  $("#lobby").show()
  $("#game").hide()
}

function showGame() {
  $("#lobby").hide()
  $("#game").show()
}

function startGame() {
  $("#lobby").hide()
  if (team == "red" || team == "blue") {
    $("#generate_task").hide()
    $("#waiting_for_task").show();
    $("#finish_task").hide()
  } else if (team == "observers") {
    $("#generate_task").show();
    $("#waiting_for_task").hide();
    $("#finish_task").hide()
  }
  $("#task_id").text("")
  $("#game").show()
}

function sync(data) {
  team = data.team;
  hasTask = data.hasTask;
  gameState = data.gameState
  if (gameState == 'lobby') {
    showLobby();
  } else if (gameState == 'game') {
    showGame();
  }
}

$(".team_picker.red").on('click', function() {
  socket.emit('switch_team_request', payload({ 'team': 'red' }))
})
$(".team_picker.blue").on('click', function() {
  socket.emit('switch_team_request', payload({ 'team': 'blue' }))
})
$(".team_picker.observers").on('click', function() {
  socket.emit('switch_team_request', payload({ 'team': 'observers' }))
})

$("#ready_button").on('click', function() {
  socket.emit('ready', payload({}))
  $("#ready_button").prop("onclick", null);
})

$("#generate_task").on('click', function() {
  socket.emit('generate_task', payload({}))
})

$("#finish_task").on('click', function() {
  socket.emit('finish_task', payload({}))
  $("#task_id").hide();
  $("#finish_task").hide();
  $("#waiting_for_task").show();
})

socket.on('sync', sync);

socket.on('team_switched', function (data) {
  team = data.team;
  $("#team_name").text(team);
});

socket.on('error', function (err) {
  console.error('Server error', err)
});

socket.on('team_full', function (data) {
  console.log('Team full', data)
});

socket.on('game_started', function (data) {
  gameState = 'game'
  startGame();
});

socket.on('game_ended', function (data) {
  gameState = 'lobby'
  showLobby();
});

socket.on('task_assigned', function (data) {
  $("#waiting_for_task").hide();
  $("#task_id").text(data.id).show()
  $("#finish_task").show();
});
