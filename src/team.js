const util = require('./util.js')

module.exports = class Team {
  constructor(name, {
    isInitial = false,
    canGenerateTasks = false,
    hasTaskQueue = false,
    maxPlayers = 0,
    isPlaying = false
  } = {}) {
    this.__name = name
    this.__isInitial = isInitial
    this.__canGenerateTasks = canGenerateTasks
    this.__hasTaskQueue = hasTaskQueue
    this.__maxPlayers = maxPlayers
    this.__isPlaying = isPlaying
    this.__players = new Set()
    this.__queue = []
  }

  get name() {
    return this.__name;
  }

  get isInitial() {
    return this.__isInitial;
  }

  get canGenerateTasks() {
    return this.__canGenerateTasks;
  }

  get hasTaskQueue() {
    return this.__hasTaskQueue;
  }

  get players() {
    return this.__players;
  }

  get maxPlayers() {
    return this.__maxPlayers;
  }

  get isPlaying() {
    return this.__isPlaying;
  }

  get playersCount() {
    return this.__players.size;
  }

  get isFull() {
    if (this.maxPlayers === 0) {
      return false
    }

    return this.playersCount == this.maxPlayers
  }

  get allReady() {
    for (const player of this.players) {
      if (!player.ready) {
        return false
      }
    }

    return true
  }

  get queueSize() {
    return this.__queue.length
  }

  enqueueTask(taskId) {
    if (this.hasTaskQueue) {
      this.__queue.push(taskId)
    }
  }

  dequeueTask() {
    if (this.hasTaskQueue) {
      return this.__queue.shift()
    }
  }

  addPlayer(player) {
    this.players.add(player);
    player.team = this;
  }

  removePlayer(player) {
    this.players.delete(player);
    player.team = null
  }

  onGameStarted() {
    this.players.forEach(player => {
      player.onGameStarted()
    })
  }

  onGameEnded() {
    this.players.forEach(player => {
      player.onGameEnded()
    })
  }

  sync(state) {
    this.players.forEach(player => {
      player.sync(state)
    })
  }

  // function assignTask(task, team) {
  //     var keys = Object.keys(players)
  //     var team_keys = [];
  //     keys.forEach(key => {
  //       if (players[key].team == team) {
  //         team_keys.push(key);
  //       }
  //     });
  //     shuffle(team_keys)
  //     var found = false;
  //     var foundBlue = false;
  //     for (i = 0; i < team_keys.length; i++) {
  //       if (!players[team_keys[i]].busy) {
  //         players[team_keys[i]].busy = true;
  //         players[team_keys[i]].socket.emit('task_generated', { 'task': task });
  //         found = true;
  //         break;
  //       }
  //     }
  //     if (!found) {
  //       console.log('Team ' + team + ' all busy!');
  //     }
  // };

  // TODO: assign task randomly
  assignTask(task) {
    if (!this.isPlaying) {
      return false
    }

    let foundFreePlayer = false

    for (const player of this.players) {
      if (!player.hasTask) {
        foundFreePlayer = true
        player.assignTask(task)
      }
      break;
    }

    if (!foundFreePlayer && this.hasTaskQueue) {
      this.enqueueTask(task)
    }
  }
}