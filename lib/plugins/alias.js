exports.name = 'alias';

exports.weight = 0;

var aliasfile = './lib/data/alias.json';

exports.requires = [
  {
    name: 'storedalias',
    file: aliasfile
  }
];

exports.help = [
  {
    usage: '!alias [alias] (to) [name]',
    description: 'Stores a unique alias of a name (or other alias).'
  },
  {
    usage: '!aliaslist [name]',
    description: 'Shows all (other) aliases shared with a given alias.'
  },
  {
    usage: '!aliasremove [alias]',
    description: 'Removes an alias from memory.'
  }
];

exports.run = {
  onmessage: function (client, message, requires) {
    var newalias,
        oldalias,
        alias,
        userid,
        aliaslist = [];
    var aliasbyid = requires.alias.storedalias;

    // Someone wants to add an alias
    var result = /^!alias (\S+) (?:to\s)(\S+)$/.exec(message.content);
    if (result && result[1] && result[2]) {
      newalias = result[1]
      oldalias = result[2];

      if (exports.functions.aliasFind(requires, newalias) !== false) {
        // Alias is taken.
        client.respond(message, 'Sorry, ' + message.from + ', ' + newalias + ' is already aliased!');
      }
      else if (exports.functions.aliasFind(requires, oldalias) !== false) {
        // Name is already an alias, so find the userid of its alias group.
        userid = exports.functions.aliasFind(requires, oldalias);
        if (aliasbyid[userid]) {
          console.log('Adding alias "' + newalias + '" to existing userid ' + userid);
          client.respond(message, 'Added alias ' + newalias + ' to the same alias group as ' + oldalias + '.');
          aliasbyid[userid].push(newalias);
        } else {
          console.log('aliasbyid['+userid+'] does not match idbyalias somehow!');
          client.respond(message, 'Sorry, ' + message.from + ', something went terribly wrong with my alias system!');
        }
      }
      else {
        // Need to assign a new userid.
        userid = aliasbyid.push([newalias,oldalias]) - 1; // Push returns length, so subtract one.
        console.log('Adding alias "' + newalias + '" to new userid ' + userid);
        client.respond(message, 'Added alias ' + newalias + ' to the same alias group as ' + oldalias + '.');
      }
      return {status:'update', file:aliasfile, data:aliasbyid};
    }

    // Someone wants a list of all aliases stored for a given alias
    var result = /^!aliaslist (\S+)$/.exec(message.content);
    if (result && result[1]) {
      alias = result[1];

      if (exports.functions.aliasFind(requires, alias) === false) {
        // Alias is taken.
        client.respond(message, 'Sorry, ' + message.from + ', I couldn\'t find any aliases for that!');
      }
      else {
        // Aliases exist, so get them all.
        userid = exports.functions.aliasFind(requires, alias);
        if (aliasbyid[userid]) {
          console.log('Fetching aliases of userid ' + userid);
          aliaslist = aliasbyid[userid];
          aliaslist.splice(aliaslist.indexOf(alias),1); // Remove the old alias

          if (aliaslist.length > 0) {
            client.respond(message, 'Aliases of ' + alias + ' include: ' + aliaslist.join(', ') + '.');
          } else {
            client.respond(message, 'Sorry, ' + message.from + ', I couldn\'t find any aliases for that!');
          }
        } else {
          console.log('aliasbyid['+userid+'] does not match idbyalias somehow!');
          client.respond(message, 'Sorry, ' + message.from + ', something went terribly wrong with my alias system!');
        }
      }
      return {status:'success'};
    }

    // Someone wants to remove a given alias
    var result = /^!aliasremove (\S+)$/.exec(message.content);
    if (result && result[1]) {
      alias = result[1];

      if (exports.functions.aliasFind(requires, alias) === false) {
        // Alias is taken.
        client.respond(message, 'Sorry, ' + message.from + ', I couldn\'t find that alias!');
      }
      else {
        // Aliases exist, so get them all.
        userid = exports.functions.aliasFind(requires, alias);
        if (aliasbyid[userid]) {
          console.log('Removing alias "' + alias + '" of userid ' + userid);
          aliasbyid[userid].splice(aliasbyid[userid].indexOf(alias),1); // Remove the unwanted alias
          aliaslist.splice(aliaslist.indexOf(alias),1);

          client.respond(message, 'Alias ' + alias + ' removed!');
        } else {
          console.log('aliasbyid['+userid+'] does not match idbyalias somehow!');
          client.respond(message, 'Sorry, ' + message.from + ', something went terribly wrong with my alias system!');
        }
      }
      return {status:'update', file:aliasfile, data:aliasbyid};
    }

    return {status:"fail"};
  }
};

exports.functions = {
  /**
   * Find the user ID by a given alias.
   *
   * @params
   *  requires (object) The standard osbot requires object.
   *  to (string) The alias to find the user ID of.
   *
   * @return (int) the ID of the user.
   */
  aliasFind: function(requires, alias) {
    var aliasbyid = requires.alias.storedalias;
    var idbyalias = exports.functions.aliasSortByAlias(aliasbyid);
    var userid = false;

    if (idbyalias.hasOwnProperty(alias)) {
      userid = idbyalias[alias];
      console.log('found userid is ' + userid);
    }

    return userid;
  },
  /**
   * Sort an array of alias arrays into an object of aliases with their user ID as values.
   *
   * @params
   *  aliasbyid (array) An array of arrays, with the parent array keys representing user IDs.
   *
   * @return (object) Aliases with their user IDs as values
   */
  aliasSortByAlias: function(aliasbyid) {
    var idbyalias = {}

    if (aliasbyid.length > 0) {
      aliasbyid.forEach(function(aliaslist,userid) {
        if (aliaslist.length > 0) {
          aliaslist.forEach(function(alias) {
            idbyalias[alias] = userid;
          });
        }
      });
    }
    return idbyalias;
  }
};