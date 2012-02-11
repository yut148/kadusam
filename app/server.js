var mongo = require('mongodb');
var express = require('express');
var config = require('./conf.js');
var db = new mongo.Db('dak', new mongo.Server(config.db.host, config.db.port, {}), {native_parser:false});
db.open(function(){});

var app = express.createServer();

// Configuration
app.configure(function () {
  app.use(express.static(__dirname + '/public'));
  app.set('view engine', 'ejs');
  app.set('views', __dirname + '/views');
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Router
app.get('/', function(req, res){
  res.render('index');
});

app.get('/t1/', function(req, res) {
  dak(function(err, c) {
    var cond = {
      time: {
        $gt:new Date(Number(req.param('min'))),
        $lt:new Date(Number(req.param('max')))
      }
    };

    c.find(cond).toArray(function(err, results) {
      res.json(results);
    });
  });
});

app.get('/api/data/:action/:from/:to?', function(req, res) {

  var _action = req.params.action;
  var from = toDate(req.params.from);
  if (isNaN(from.valueOf())) {
    res.json('oops! invalid parameter', 400);
  }
  var to = toDate(req.params.to);
  if (req.params.to && isNaN(to.valueOf())) {
    res.json('oops! invalid parameter', 400);
  }

  console.log("api data: ", _action, from, to); 

  dak(function(err, c) {
    var cond = {
      action: _action,
      time: {$gt:from}
    };

    if (to) {
      cond.time.$lt=to;
    }

    c.find(cond).toArray(function(err, results) {
      res.json(results);
    });
  });
});

app.get('/api/list/actions', function(req, res) {
  dak(function(err, c) {
    c.distinct("action", (function(err, results) {
      res.json(results);
    }));
  });
});


function dak(callback) {
  db.collection('app', callback);
}

function toDate(str) {
  if (str) {
    if (str.match(/^[0-9]*$/)) {
      return new Date(parseInt(str));
    }
    return new Date(str);
  }

  return undefined;
}

app.get('/mg/', function(req, res) {
  res.contentType('application/json');

  var insert_id = req.params.id;
  db.collection('test', function(err, collection) {
    collection.find({id: {$or: [{$gt:'1'}, {$gt:1}]}}).toArray(function(err, results){
      res.send(results);
    });
    collection.find().toArray(function(err, results){
      res.send(results);
    });
  });
});

app.get('/mg/:id/:name', function(req, res) {
  //var data = {id:parseInt(req.params.id), data:req.params.name};
  var data = {id:req.params.id, data:req.params.name};
  db.collection('test', function(err, collection) {
    collection.insert(data, function(err, docs){});
    res.send("insert ok");
    console.log(data);
  });
});

app.listen(3000);
