const EventEmitter = require('events');
const express = require('express')
const express_app = express();
const server = require('http').Server(express_app);
const io = require('socket.io')(server);
const mustacheExpress = require('mustache-express');

module.exports = class Server extends EventEmitter {
  constructor({ host, port, staticDir, viewsDir } = {}) {
    super()

    this.__host = host
    this.__port = port
    this.__staticDir = staticDir
    this.__viewsDir = viewsDir
  }

  start() {
    express_app.engine('mustache', mustacheExpress());
    express_app.set('view engine', 'mustache')
    express_app.set('views', this.__viewsDir)

    express_app.get('/', ((req, res) => {
      res.render('index', { 'host': this.__host, 'port': this.__port });
    }).bind(this));

    express_app.use(express.static(this.__staticDir))

    io.on('connection', ((socket) => {
      this.emit('new_socket', socket)
    }).bind(this));

    // WARNING: express_app.listen(80) will NOT work here!
    server.listen(this.__port, this.__host);
    console.log('Listening on ' + this.__host + ':' + this.__port)

  }
}

