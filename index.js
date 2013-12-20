var irc = require('irc')
  , fs = require('fs')
  , parse = require('esprima').parse
  , evaluate = require('static-eval')

var config = require('./config')

var functions = {
  loadPlugins: function () {
    plugins = []
    fs.readdirSync('./lib/plugins').forEach(function (name) {
      var plugin = require('./lib/plugins/' + name)
      plugins.push(plugin)
    })
  },
  checkCommand: function (command, args) {
    return command.run({
      client: client,
      to: args.to,
      from: args.from,
      message: args.message,
      config: config
    })
  }
}

var client = new irc.Client(config.network, config.handle, {
  channels: config.channels
})

var builtins = [
  {
    name: 'reload',
    help: function () {
      return {
        usage: '!reload',
        description: 'Reloads all definition files'
      }
    },
    run: function (args) {
      if (args.to == args.config.handle) {
        var result = /^!reload$/.exec(args.message)
        if (result) {
          functions.loadPlugins()
          return true
        }
      }
      return false
    }
  },
  {
    name: 'help',
    help: function () {},
    run: function () { return false }
  }
]

var plugins = []
functions.loadPlugins()

client.addListener('error', function(message) {
        console.log('error: ', message);
});

client.addListener('message', function(from, to, message) {
  console.log(from + ' said ' + message + ' to ' + to)

 builtins.forEach(function (command) {
    if (functions.checkCommand(command, {
      to: to,
      from: from,
      message: message
    })) {
      return
    }
  })

  plugins.forEach(function (command) {
    if (functions.checkCommand(command, {
      to: to,
      from: from,
      message: message
    })) {
      return
    }
  })

})
