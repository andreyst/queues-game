const EventEmitter = require('events');
const uuid = require('uuid')

module.exports = class Player extends EventEmitter {
  constructor(socket) {
    super()

    this.__id = uuid.v4();
    this.__socket = socket;
    this.__team = null;
    this.__ready = false;
    this.__task = null;

    this.__socket.on('disconnect', this.__onDisconnect.bind(this));
    this.__socket.on('switch_team_request', this.__onSwitchTeamRequest.bind(this));
    this.__socket.on('ready', this.__onReady.bind(this));
    this.__socket.on('generate_task', this.__onGenerateTask.bind(this));
    this.__socket.on('finish_task', this.__onFinishTask.bind(this));
  }

  get id() {
    return this.__id
  }

  get socket() {
    return this.__socket
  }

  get team() {
    return this.__team
  }

  set team(team) {
    this.__team = team;
  }

  get hasTask() {
    return this.__task !== null
  }

  get ready() {
    return this.__ready
  }

  set ready(ready) {
    this.__ready = ready
  }

  get canGenerateTasks() {
    return this.__team.canGenerateTasks
  }

  sync(gameState) {
    let teamName = this.__team !== null ? this.__team.name : ""

    this.__socket.emit('sync', {
      team: teamName,
      gameState,
      hasTask: this.__hasTask
    })
  }

  error(err) {
    this.__socket.emit('error', err)
  }

  leaveCurrentTeam() {
    if (this.__team) {
      this.__team.removePlayer(this);
    }
  }

  assignTask(task) {
    console.log('Assigned task', task.id, 'to player', this.id)

    this.__task = task;
    this.__socket.emit('task_assigned', task)
  }

  __onDisconnect() {
    this.emit('disconnect', this)
  }

  __onSwitchTeamRequest(data) {
    this.emit('switch_team_request', this, data.team)
  }

  onTeamChanged() {
    this.__socket.emit('team_switched', { team: this.__team.name });
  }

  __onReady(data) {
    this.__ready = true;
    this.emit('ready', this)
  }

  onGameStarted() {
    this.__socket.emit('game_started')
  }

  __onGenerateTask(data) {
    this.emit('generate_task', this, data)
  }

  __onFinishTask(data) {
    this.__task = null;
    this.emit('finish_task', this, data)
  }

  onGameEnded() {
    this.__socket.emit('game_ended')
  }
}