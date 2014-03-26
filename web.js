var express = require("express");
var logfmt = require("logfmt");
var request = require("request");
var cheerio = require("cheerio");

var app = express();

app.use(logfmt.requestLogger());
app.use(express.bodyParser());

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.post('/showme', function(req, res) {
  console.log(req.body);
  var user = req.body.user_name;
  var text = req.body.text;
  var trigger = req.body.trigger_word;

  var match = (new RegExp(trigger + '\\s*@?(\\w+)')).exec(text);
  if (match) {
    showme(match[1], function(link) {
      res.send(link ? {text: user + ': ' + link} : 200);
    });
  } else {
    res.send(200);
  }
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

function showme(name, cb) {
  request('https://stripe.com/about', function(err, response, body) {
    if (failure = (err || response.statusCode != 200)) {
      console.error(failure);
      cb();
    }
    var img = cheerio.load(body)('#team-' + name + ' img');
    cb(img.length ? 'https://stripe.com' + img.attr('src') : null);
  });
}

