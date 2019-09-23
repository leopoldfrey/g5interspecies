var express     = require("express");
var http        = require("http");
//var request		= require("request");
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

var fileName = 'public/votes.json';
var rawvotes = fs.readFileSync(fileName);
var votes = JSON.parse(rawvotes);
var curVote = -1;
var lang = 'fr';
var referendum = 'present';

/*
request('https://www.grabugemusic.fr/g5/votes.json').on('data',(data) => {
    try{
		votes = JSON.parse(data);    
    }
    catch(error){
        console.log("ERROR WHILE READING JSON : "+error);
    }
});//*/

/*----------- newVote receive -----------*/
app.post('/newVote', function (req, res) {
  console.log('| Server received /newVote '+req.body.vote);
  if (req.body.vote) {
  	console.log('- New vote : '+req.body.ref +' '+req.body.vote +' '+ req.body.value);
  	if(votes.hasOwnProperty(req.body.ref))
  	{
  		ref = votes[req.body.ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == req.body.vote)
  			{
  				q['options'].forEach(function(o) {
  					if(o['id'] == req.body.value)
  					{
  						//console.log("HOURRAY");
  						o['votes'] += 1;
  					}
  				});
  			}
  		});
  		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync(fileName, jsonString, err => {
			if (err) {
				console.log('Error writing file', err);
			} else {
				console.log('Successfully wrote file');
			}
		});
		//console.log("DONE");
  			
  	} else {
  		console.log("not found : "+req.body.ref);
  	}
  } else {
    console.log("* Error: invalid vote received");  
  }
  
  res.send("ok");
})

/*----------- addvote receive -----------*/
app.post('/addVote', function (req, res) {
  console.log('| Server received /addVote '+req.body.vote);
  if (req.body.vote) {
  	console.log('- Add vote : '+req.body.ref +' '+req.body.vote +' '+ req.body.value);
  	if(votes.hasOwnProperty(req.body.ref))
  	{
  		ref = votes[req.body.ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == req.body.vote)
  			{
  				q['votes'] += 1;
  				q['growth'] += parseFloat(req.body.value);
  			}
  		});
  		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync(fileName, jsonString, err => {
			if (err) {
				console.log('Error writing file', err);
			} else {
				console.log('Successfully wrote file');
			}
		});
  	} else {
  		console.log("not found : "+req.body.ref);
  	}
  } else {
    console.log("* Error: invalid vote received");  
  }
  res.send("ok");
})

/*----------- addvoteMulti receive -----------*/
app.post('/addVoteMulti', function (req, res) {
  console.log('| Server received /addVoteMulti '+req.body.vote);
  if (req.body.vote) {
  	console.log('- Add vote multi : '+req.body.ref +' '+req.body.id+' '+req.body.vote +' '+ req.body.value);
  	if(votes.hasOwnProperty(req.body.ref))
  	{
  		ref = votes[req.body.ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == req.body.id)
  			{
  				q['options'].forEach(function(o) {
  					if(o['id'] == req.body.vote)
  					{
  						o['votes'] += 1;
  						o['growth'] += parseFloat(req.body.value);
  					}
  				});
  			}
  		});
  		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync(fileName, jsonString, err => {
			if (err) {
				console.log('Error writing file', err);
			} else {
				console.log('Successfully wrote file');
			}
		});
  	} else {
  		console.log("not found : "+req.body.ref);
  	}
  } else {
    console.log("* Error: invalid vote received");  
  }
  res.send("ok");
})

/*----------- addvote receive -----------*/
/*app.post('/addvote', function (req, res) {
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
})//*/

/*----------- setLang receive -----------*/
app.post('/setLang', function (req, res) {
	console.log('| Server received /setLang '+req.body.lang);
	lang = req.body.lang;
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "setLang",
					lang: lang
				}));
		});
  	}
	res.send("ok");
})

/*----------- setReferendum receive -----------*/
app.post('/setReferendum', function (req, res) {
	console.log('| Server received /setReferendum '+req.body.referendum);
	referendum = req.body.referendum;
	curVote = -1;
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "setReferendum",
					referendum: referendum,
					vote: curVote
				}));
		});
  	}
	res.send("ok");
})

/*------------ CLEAR VOTES ----------*/
app.post('/clearVotes', function(req, res) {
	console.log('| Server received /clearVotes');	
	//console.log('TODO CLEAR VOTES');
	var questions = Object.keys(votes);
	questions.forEach(function(q) {
		votes[q]['content'].forEach(function(o) {
			//console.log(o);
			if(o.hasOwnProperty('votes'))
				o['votes'] = 0;
			if(o.hasOwnProperty('growth'))
				o['growth'] = 0;
			if(o.hasOwnProperty('options'))
				o['options'].forEach(function(o) {
					if(o.hasOwnProperty('votes'))
						o['votes'] = 0;
					if(o.hasOwnProperty('growth'))
						o['growth'] = 0;
				});
		});
		jsonString = JSON.stringify(votes, null, 2);
  		fs.writeFileSync(fileName, jsonString, err => {
			if (err) {
				console.log('Error writing file', err)
			} else {
				console.log('Successfully wrote file')
			}
		})//*/
	});
	
	res.send("ok");
})

/*------------ CLEAR GLOBAL VOTES ----------*/
app.post('/clearGlobalVotes', function(req, res) {
	console.log('| Server received /clearGlobalVotes TODO');	
	console.log('TODO CLEAR GLOBAL VOTES');
	res.send("todo");
})

/*------------ ADD LOCAL VOTES ----------*/
app.post('/addLocalVotes', function(req, res) {
	console.log('| Server received /addLocalVotes TODO');	
	console.log('TODO ADD LOCAL VOTES');
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
	res.send(referendum);
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "goto",
					lang: lang,
					referendum: referendum,
					vote: curVote,
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
