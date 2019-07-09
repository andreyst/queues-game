localStorage.debug = 'socket.io-parser,socket.io-client:socket';
var socket = io.connect('http://' + host + ':' + port);

var id;
var team;

function payload(payload) {
  payload.id = id;
  return payload;
}

function showLobby() {
  $("#lobby").show()
  $("#game").hide()
}

function startGame() {
  $("#lobby").hide()
  if (team == "red" || team == "blue") {
    $("#generate_task").hide()
    $("#waiting_for_task").show();
    $("#finish_task").hide()
  } else if (team == "observer") {
    $("#generate_task").show();
    $("#waiting_for_task").hide();
    $("#finish_task").hide()
  }
  $("#game").show()
}

$(".team_picker.red").on('click', function() {
  socket.emit('change_team', payload({ 'team': 'red' }))
})
$(".team_picker.blue").on('click', function() {
  socket.emit('change_team', payload({ 'team': 'blue' }))
})
$(".team_picker.observer").on('click', function() {
  socket.emit('change_team', payload({ 'team': 'observer' }))
})

$("#start_game").on('click', function() {
  socket.emit('start_game', payload({}))
  $("#start_game").prop("onclick", null);
})

$("#generate_task").on('click', function() {
  socket.emit('generate_task', payload({}))
})

$("#finish_task").on('click', function() {
  socket.emit('finish_task', payload({}))
  $("#waiting_for_task").show();
  $("#finish_task").hide();
})

socket.on('init', function (data) {
  id = data.id;
  team = data.team;
  busy = data.busy;
  if (data.state == 'lobby') {
    showLobby();
  } else if (data.state == 'game') {
    startGame();
  }
});

socket.on('team_changed', function (data) {
  team = data.team;
  $("#team_name").text(team);
});

socket.on('team_full', function (data) {
  console.log('Team full', data)
});

socket.on('game_started', function (data) {
  startGame();
});

socket.on('task_generated', function (data) {
  $("#waiting_for_task").hide();
  $("#finish_task").show();
});
