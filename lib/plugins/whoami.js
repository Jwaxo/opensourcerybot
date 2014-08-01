exports.name = 'whoami';

exports.help = [
  {
    usage: 'who are you?',
    description: 'Provides an elevator speech style autobiography.'
  }
];

exports.run = {
  onmessage: function (client, message) {
    var result = /^who are you/i.exec(message.content);
    if (result) {
      client.respond(message, message.from + ', I am an IRC bot. Originally envisioned by Adam DiCarlo and maintained by the friendly folks at OpenSourcery');
      return {status:'success'};
    }
    return {status:"fail"};
  }
};
