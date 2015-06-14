var fs = require('fs'),
  path = require('path'),
  express = require('express'),

  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http),

  bodyParser = require('body-parser'),
  session = require('express-session');



app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/test', function(req, res){
  res.sendfile('public/test.html');
});

io.sockets.on('connection', function(socket){
  console.log('a user connected');

  socket.on('test', function(data){
    console.log('test : ' + data);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on *:3000');
});


// app.get('/comments.json', function(req, res) {
//   fs.readFile('comments.json', function(err, data) {
//     res.setHeader('Content-Type', 'application/json');
//     res.send(data);
//   });
// });

// app.post('/comments.json', function(req, res) {
//   fs.readFile('comments.json', function(err, data) {
//     var comments = JSON.parse(data);
//     comments.push(req.body);
//     fs.writeFile('comments.json', JSON.stringify(comments, null, 4), function(err) {
//       res.setHeader('Content-Type', 'application/json');
//       res.setHeader('Cache-Control', 'no-cache');
//       res.send(JSON.stringify(comments));
//     });
//   });
// });


// app.listen(app.get('port'), function() {
//   console.log('Server started: http://localhost:' + app.get('port') + '/');
// });
