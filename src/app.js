Game = require('./game.js')
Player = require('./player.js')
Server = require('./server.js')

class App {
  start() {
    const staticDir = __dirname + '/../static';
    const viewsDir = __dirname + '/../views'
    const host = process.argv[2] || 'localhost';
    const port = process.argv[3] || 8000

    this.__game = new Game()
    this.__game.start()

    let server = new Server({ host, port, staticDir, viewsDir })
    server.on('new_socket', this.__onNewSocket.bind(this))
    server.start()
  }

  __onNewSocket(socket) {
    let player = new Player(socket);
    this.__game.addPlayer(player)
  }
}

app = new App()
app.start()
