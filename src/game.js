const Team = require('./team.js')
const Player = require('./player.js')
const uuid = require('uuid')

module.exports = class Game {
  constructor() {
    this.__state = 'lobby';
    this.__teams = new Map()
    this.__tasksGenerated = 0;

    this.__teams.set("observers", new Team("observers", { isInitial: true, canGenerateTasks: true }));
    this.__teams.set("red",       new Team("red",       { maxPlayers: 2, isPlaying: true }));
    this.__teams.set("blue",      new Team("blue",      { hasTaskQueue: true, maxPlayers: 4, isPlaying: true }));

    setTimeout(this.__heartbeat.bind(this), 3000)
  }

  __heartbeat() {
    let totalPlayers = 0
    let queueSizes = {}
    this.__teams.forEach((team, teamName) => {
      totalPlayers += team.playersCount
      if (team.hasTaskQueue) {
        queueSizes[teamName] = team.queueSize
      }
      team.sync(this.__state)
    })

    console.log(
      'Total players', totalPlayers,
      '| Tasks generated', this.__tasksGenerated,
      '| Queue sizes', queueSizes
    )
    setTimeout(this.__heartbeat.bind(this), 3000)
  }

  addPlayer(player) {
    console.log('Adding new player: ' + player.id)

    player.on('disconnect', this.__onDisconnect.bind(this))
    player.on('switch_team_request', this.__onSwitchTeamRequest.bind(this))
    player.on('ready', this.__onReady.bind(this))
    player.on('generate_task', this.__onGenerateTask.bind(this))
    player.on('finish_task', this.__onFinishedTask.bind(this))

    this.__switchTeam(player, this.__teams.get("observers"))
    player.sync(this.__state)
  }

  __onDisconnect(player) {
    console.log('Disconnecting player: ' + player.id)

    player.leaveCurrentTeam()
  }

  __onSwitchTeamRequest(player, teamName) {
    console.log('Switching team of player ' + player.id + ' to ' + teamName);

    let team = this.__teams.get(teamName);
    if (team === undefined) {
      player.error({ message: 'Unknown team: ' + teamName })
      return;
    }

    if (team.isFull) {
      player.error({ message: 'Team ' + team.name + ' is full' })
      return;
    }

    this.__switchTeam(player, team)

    if (player.ready) {
      player.ready = false
    }
  }

  __switchTeam(player, team) {
    player.leaveCurrentTeam();
    team.addPlayer(player);
    player.onTeamChanged()
  }

  __onReady(player) {
    let allReady = true;
    let allPlayingTeamsHaveMembers = true;
    this.__teams.forEach((team, teamName) => {
      if (team.isPlaying && team.playersCount < 1) {
        allPlayingTeamsHaveMembers = false
      }

      allReady = team.allReady
    })

    if (allReady && allPlayingTeamsHaveMembers) {
      this.__startRound()
    }
  }

  __onGenerateTask(player, task) {
    console.log('Generate task request from player: ' + player.id)

    if (!player.canGenerateTasks) {
      return
    }

    task = { id: uuid.v4() }
    this.__teams.forEach((team, teamName) => {
      team.assignTask(task)
    })

    this.__tasksGenerated += 1;
  }

  __onFinishedTask(player) {
    let team = player.team

    if (team.hasTaskQueue && team.queueSize > 0) {
      player.assignTask(team.dequeueTask())
    }
  }

  start() {
    console.log("The game is on!")
  }

  __startRound() {
    this.__state = 'game'
    this.__teams.forEach((team, teamName) => {
      team.onGameStarted()
    })
  }

  __finishRound() {
    this.__state = 'lobby'
    this.__teams.forEach((team, teamName) => {
      team.players.forEach(player => {
        team.onGameEnded()
      })
    })
  }
}

