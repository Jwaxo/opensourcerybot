exports.name = 'karma';

exports.weight = 0;

var karmafile = './lib/data/karma.json';
var lastaward;

exports.requires = [
  {
    name: 'storedkarma',
    file: karmafile,
    type: 'object'
  }
];

exports.help = [
  {
    usage: '[user]++',
    description: 'Gives a user (not you) karma. It\'s free! Be generous!'
  },
  {
    usage: '[user]--',
    description: 'Removes karma from a user (can be you). Be nice!'
  },
  {
    usage: '!karma [user]',
    description: 'Displays karma of a given user.'
  }
];

exports.run = {
  onmessage: function (client, message, requires) {
    var storedkarma = requires.karma.storedkarma,
        functions = requires.functions;
    var users = [],
        recipient,
        recipientid, // We set the userids equal to the user in case the alias module isn't on
        axis,
        judge = message.from,
        judgeid = judge,
        totalkarma,
        amount = 1,
        dice;

    // Someone has affected the karmic sphere!
    var result = /^(\S+?)\s*(\+\+|--)(?:\s+)?d?([0-9]+)?/.exec(message.content);
    if (result) {
      recipient = result[1];
      axis = result[2];

      // Find the aliases if alias. is enabled
      if (functions.aliasFind) {
        recipientid = functions.aliasFind(requires, result[1]);
        judgeid = functions.aliasFind(requires, judge);
      }

      // Check for sending to a group if groups are enabled
      if (functions.groupGet && recipient.indexOf('@') === 0) {
        users = functions.groupGet(client, requires, message, recipient.substring(1));
      }
      else {
        users.push(recipientid);
      }

      // Check for a diceroll if diceroll is enabled.
      if (result[3]) {
        dice = result[3];
        if (functions.randRoll) {
          amount = functions.randRoll(dice);
          if (axis === '++') {
            client.speak(message, amount + ' karma randomly given to ' + recipient);
          }
          else {
            client.speak(message, amount + ' karma randomly taken from ' + recipient);
          }
        }
        else {
          client.speak(message, 'Sorry, ' + judge + ', I don\'t have diceroll functionality.');
        }
      }
      if (!storedkarma.hasOwnProperty(judgeid)) {
        storedkarma[judgeid] = {
          up: 0,
          down: 0,
          given: 0,
          taken: 0
        };
      }

      users.forEach(function(user) {
        if (!storedkarma.hasOwnProperty(user)) {
          storedkarma[user] = {
            up: 0,
            down: 0,
            given: 0,
            taken: 0
          };
        }
        if (axis === '++' && user !== message.from) {
          storedkarma = exports.functions.karmaAdd(client, requires, message, user, amount);
        }
        else if (axis === '++') {
          client.speak(message, 'Hey, ' + message.from + '! You can\'t give karma to yourself!');
        }
        else if (axis === '--') {
          storedkarma = exports.functions.karmaRemove(client, requires, message, user, amount);
        }
      });

      if (axis === '++') {
        if (requires.functions.randInt(0,12) === 5 && lastaward !== judgeid) {
          // Randomly award karma to those who give karma, as long as they weren't
          // the last recipients of the random karma
          client.speak(message, message.from + '++ for keeping the karma rolling.');
          storedkarma[judgeid].up += 1;
          storedkarma[client.config.handle].given += 1;
          lastaward = judgeid;
        }
      }
      return {status:'update', file:karmafile, data:storedkarma};
    }

    // What is a user's karma? A miserable little pile of secrets.
    var result = /^!karma\s+(\S+)\s*$/.exec(message.content);
    if (result) {
      user = result[1];
      if (storedkarma.hasOwnProperty(user)) {
        totalkarma = storedkarma[user].up - storedkarma[user].down;
        client.speak(message, 'User ' + user + ' has cumulative karma of ' + totalkarma + ' (+' + storedkarma[user].up + '|-' + storedkarma[user].down + ')');
      }
      else {
        client.speak(message, 'I couldn\'t find karma for that user, ' + message.from + '!');
      }
      return {status:'success'};
    }
    return {status:"fail"};
  },
  onjoin: function(client, message, requires) {
    var storedkarma = requires.karma.storedkarma;
    var handle = client.config.handle;

    // Set up osbot's base karma score.
    if (!storedkarma.hasOwnProperty(handle)) {
      storedkarma[handle] = {
        up: 0,
        down: 0,
        given: 0,
        taken: 0
      };
    }

    return {status:"fail"};
  }
};

exports.functions = {
  /**
   * Add karma to a user.
   *
   * @params
   *  client (object) The standard osbot client object.
   *  requires (object) The standard osbot requires object.
   *  message (object) The standard osbot message object.
   *  to (string) The user getting the karma, assumed not be "from".
   *  amount (int) The amount of karma to give.
   *
   * @return (object) Adjusted storedkarma object
   */
  karmaAdd: function(client, requires, message, to, amount) {
    var storedkarma = requires.karma.storedkarma;
    var from = message.from;

    storedkarma[to].up += amount;
    storedkarma[message.from].given += amount;
    console.log(message.from + ' awarded ' + amount + ' karma to ' + to);
    return storedkarma;
  },
  /**
   * Remove karma from a user.
   *
   * @params
   *  client (object) The standard osbot client object.
   *  requires (object) The standard osbot requires object.
   *  message (object) The standard osbot message object.
   *  to (string) The user losing the karma, assumed not be "from".
   *  amount (int) The amount of karma to take.
   *
   * @return (object) Adjusted storedkarma object
   */
  karmaRemove: function(client, requires, message, to, amount) {
    var storedkarma = requires.karma.storedkarma;
    var user = message.from;

    if (to === user) {
      client.speak(message, 'If you say so, ' + user + '...');
    }
    else {
      storedkarma[user].taken += amount;
    }
    storedkarma[to].down += amount;
    console.log(user + ' took ' + amount + ' karma from ' + to);
    return storedkarma;
  }
};