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

var goog = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&safe=active&q='

app.post('/xkcd', function(req, res) {
  var match = /xkcd.*?(\d+)/.exec(req.body.text);
  if (!match) return res.send(200);
  console.log('https://xkcd.com/' + match[1] + '/info.0.json');
  request('https://xkcd.com/' + match[1] + '/info.0.json', function(err, response, body) {
    if (err || response.statusCode != 200) {
      console.error(err || response.statusCode);
      res.send(200);
    } else {
      res.send({username: 'xkcdbot', text: JSON.parse(body).img, parse: 'full'});
    }
  });
});

app.post('/showme', function(req, res) {
  console.log(req.body);
  var user = req.body.user_name;
  var text = req.body.text;
  var trigger = req.body.trigger_word;

  var match = (new RegExp(trigger + '\\s*@?(\\w+)\\s*$')).exec(text);
  if (match) {
    showme(match[1], function(link) {
      if (link) {
        res.send({text: '@' + user + ': ' + link, parse: 'full'});
      } else {
        fallback();
      }
    });
  } else {
    fallback();
  }

  function fallback() {
    var q = text.replace(trigger, '');
    request(goog + q, function(err, response, body) {
      if (err || response.statusCode != 200) {
        console.error(err, response.statusCode);
        res.send({text: ':sadpanda:'});
      } else {
        console.log(JSON.parse(body));
        var response = JSON.parse(body).responseData;
        if (response && response.results.length) {
          res.send({text: '@' + user + ': ' + response.results[0].url, parse: 'full'});
        } else {
          res.send({text: ':sadpanda:'});
        }
      }
    });
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

