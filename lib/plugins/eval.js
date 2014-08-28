exports.name = 'eval';

exports.requires = [
  {
    name: 'esprima',
    file: 'esprima'
  },
  {
    name: 'evaluate',
    file: 'static-eval'
  }
];

exports.help = [
  {
    usage: '!eval [expression]',
    description: 'Evaluates a mathematical expression.'
  }
];

exports.run = {
  onmessage: function (client, message, requires) {
    var result = /^!eval\s+(.+)$/.exec(message.content);
    var parse = requires.eval.esprima.parse,
        evaluate = requires.eval.evaluate;

    if (result) {
      try {
        console.log('About to evaluate ' + result[1]);
        var ast = parse(result[1]).body[0].expression;
        client.respond(message, 'Evaluated function: '+ evaluate(ast));
      }
      catch (e) {
        client.respond(message, 'Sigh... Exception: ' + e.toString());
      }
      return {status:'success'};
    }
    return {status:"fail"};
  }
};
