var express     = require("express");
var http        = require("http");
var serveIndex  = require("serve-index");
var multer      = require("multer");
var fs          = require("fs");
var path        = require("path");
var WebSocket   = require("ws");
var WebSocketServer   = WebSocket.Server;
var bodyParser  = require("body-parser");

var app         =   express();
var server = http.createServer(app);


/* PARAMETERS */

// use alternate localhost and the port Heroku assigns to $PORT
const port = process.env.PORT || 3000;
//var webServerPort = 8080; // Web server (http) listens on this port

app.get('/',function(req,res){
      res.sendFile(__dirname + "/public/index.html");
});

app.get('/index.html',function(req,res){
      res.sendFile(__dirname + "/public/index.html");
});

app.get('/id_animal.html',function(req,res){
      res.sendFile(__dirname + "/public/id_animal.html");
});

app.get('/id_vegetal.html',function(req,res){
      res.sendFile(__dirname + "/public/id_vegetal.html");
});

app.get('/id_mineral.html',function(req,res){
      res.sendFile(__dirname + "/public/id_mineral.html");
});

app.get('/id_human.html',function(req,res){
      res.sendFile(__dirname + "/public/id_human.html");
});

app.get('/id_machine.html',function(req,res){
      res.sendFile(__dirname + "/public/id_machine.html");
});

app.get('/referendum.html',function(req,res){
      res.sendFile(__dirname + "/public/referendum.html");
});

app.get('/controller.html',function(req,res){
      res.sendFile(__dirname + "/public/controller.html");
});

app.get('/votes.json',function(req,res){
      res.sendFile(__dirname + "/public/votes.json");
});

app.get('/backup.json',function(req,res){
      res.sendFile(__dirname + "/public/backup.json");
});

app.get('/rocio.html',function(req,res){
      res.sendFile(__dirname + "/public/rocio.html");
});

app.get('/results.html',function(req,res){
      res.sendFile(__dirname + "/public/results.html");
});

app.use('/scripts', express.static(__dirname + '/node_modules/chart.js/dist/'));

/*----------- Static Files -----------*/
app.use('/vendor', express.static('public/vendor'));
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/img', express.static('public/img'));

app.use('/uploads', express.static('uploads'));
app.use('/uploads', serveIndex(__dirname + '/uploads'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

server.listen(port,function() {
    console.log("| Web Server listening port " + port);
});
/*----------- Static Files -----------*/

// Tools
String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};


/*----------- Img receive -----------*/

var upload = multer({ dest: '/tmp' })

app.post('/image', upload.single("image"), function (req, res) {
   console.log('| Server received /image');
   var date = new Date();

   //var timeToAppend = date.getHours() + "h" + date.getMinutes() + "m" +  date.getSeconds() + "s" + date.getMilliseconds();

   var type = req.file.mimetype.split("/")[1];
   var name = req.body.name.replaceAll(" ", "_");
   var file = __dirname + "/uploads/" + name + /*"_" + timeToAppend +*/ "." + type;
   file = file.replaceAll(" ", "_");
   fs.readFile( req.file.path, function (err, data) {
        fs.writeFile(file, data, function (err) {
         if( err ){
              console.error( err );
              response = {
                   message: 'Sorry, file could not be uploaded.',
                   filename: req.file.originalname
              };
         }else{
               console.log("- Image saved");
               response = {
                   message: 'File uploaded successfully',
                   filename: req.file.originalname
              };
          }
          res.end( JSON.stringify( response ) );
       });
   });
});

var rawvotes = fs.readFileSync('public/votes.json');
var votes = JSON.parse(rawvotes);
var curVote = -1;
/*var questions = Object.keys(votes)
questions.forEach(function(q) {
	console.log(q);
	var answers = Object.keys(votes[q]);
	answers.forEach(function(ans) {
		console.log("  "+(votes[q])[ans]+" - "+ans);
	});
});//*/

/*----------- vote receive -----------*/
app.post('/vote', function (req, res) {
  console.log('| Server received /vote '+req.body.vote);
  if (req.body.vote) {
  	console.log('- New vote : '+req.body.vote +' '+ req.body.value);
  	if(votes.hasOwnProperty(req.body.vote))
  	{
  		v = votes[req.body.vote];
  		v[req.body.value]+=1;
  		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync('public/votes.json', jsonString, err => {
			if (err) {
				console.log('Error writing file', err)
			} else {
				console.log('Successfully wrote file')
			}
		})
  	} else {
  		console.log("not found : "+req.body.vote);
  	}
  } else {
    console.log("* Error: invalid vote received");  
  }
  
  res.send("ok");
})

/*----------- addvote receive -----------*/
app.post('/addvote', function (req, res) {
  console.log('| Server received /addvote '+req.body.vote);
  if (req.body.vote) {
  	console.log('- Add vote : '+req.body.vote +' '+ req.body.ref +' '+ req.body.value);
  	if(votes.hasOwnProperty(req.body.vote))
  	{
  		v = votes[req.body.vote];
  		v[req.body.ref] = (parseFloat(v[req.body.ref]) + parseFloat(req.body.value));
  		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync('public/votes.json', jsonString, err => {
			if (err) {
				console.log('Error writing file', err)
			} else {
				console.log('Successfully wrote file')
			}
		})
  	} else {
  		console.log("not found : "+req.body.vote);
  	}
  	//console.log(votes);
  	
  } else {
    console.log("* Error: invalid vote received");  
  }
  
  res.send("ok");
})

/*------------ CLEAR VOTES ----------*/
app.post('/clearvotes', function(req, res) {
	console.log('| Server received /clearvotes');	
	var questions = Object.keys(votes)
	questions.forEach(function(q) {
		//console.log(q);
		var answers = Object.keys(votes[q]);
		answers.forEach(function(ans) {
			if(ans != 'type' && ans != 'title' && ans != 'title-FR' && ans != 'title-ENG') {
				(votes[q])[ans] = 0;
			}
			//console.log("  "+(votes[q])[ans]+" - "+ans);
		});
		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync('public/votes.json', jsonString, err => {
			if (err) {
				console.log('Error writing file', err)
			} else {
				console.log('Successfully wrote file')
			}
		})
	});
	
	res.send("ok");
})

/*------------ CLEAR GLOBAL VOTES ----------*/
app.post('/clearglobalvotes', function(req, res) {
	console.log('| Server received /clearglobalvotes TODO');	
	// TODO CLEAR GLOBAL VOTES
	res.send("todo");
})

/*------------ ADD LOCAL VOTES ----------*/
app.post('/addlocalvotes', function(req, res) {
	console.log('| Server received /addlocalvotes TODO');	
	// TODO ADD LOCAL VOTES
	res.send("todo");
})

/*------------ GOTO VOTE ----------*/
app.post('/gotoVote', function(req, res) {
	console.log('| Server received /gotoVote '+req.body.vote);	
	
	curVote = req.body.vote;
	
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "nextvote",
					vote: curVote
				}));
		});
  	}
	
	res.send("ok");
})

/*------------ I AM NEW WHERE TO ----------*/
app.post('/iAmNewWheteTo', function(req, res) {
	console.log('| Server received /iAmNewWheteTo');
	if(curVote >= 13)	
		res.send(curVote);
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "users",
					users: wss.clients.size
				}));
		});
  	}
})

/*------------ GET USERS ----------*/
app.post('/getUsers', function(req, res) {
	console.log('| Server received /getUsers');
	//console.log(wss.clients.size);
	res.send(""+wss.clients.size);
})

/*------------ SEND OSC ------------*/
app.post('/sendOSC', function(req, res) {
	console.log('| Server received /sendOSC');
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "sendOSC",
					address: req.body.address,
					args: req.body.args
				}));
		});
  	}
  	res.send("ok");
})

/*----------- WS Server -----------*/

const wss = new WebSocketServer({
    server: server,
    autoAcceptConnections: true
});

wss.closeTimeout = 180 * 1000;

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('| WebSocket received : %s', message);

    var msg = JSON.parse(message);
    
    switch(msg.type) {
  		default:
  			console.log('* ignored : '+msg.type);
  			break;
    }



  });
});
