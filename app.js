var express     = require("express");
var http        = require("http");
var serveIndex  = require("serve-index");
var multer      = require("multer");
var fs          = require("fs");
var path        = require("path");
var WebSocket   = require("ws");
var WebSocketServer   = WebSocket.Server;
var bodyParser  = require("body-parser");
var ftpClient 	= require('ftp-client');
	
var app         = express();
var server 		= http.createServer(app);

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
app.use('/data', express.static('public/data'));

app.use('/uploads', express.static('uploads'));
app.use('/uploads', serveIndex(__dirname + '/uploads'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*----------- Download/Upload votes -----------*/

var localDataFolder = path.dirname(fs.realpathSync(__filename))+'/public/data';
console.log('local data folder', localDataFolder);

// FTP CONFIG
config = {
    host: 'ftp.cluster021.hosting.ovh.net',
    port: 21,
    user: 'grabugemuz',
    password: 'Asifnu12'
};
options = {
    logging: 'basic'
};
    
function downloadVotes()
{
	client = new ftpClient(config, options);
	client.connect(function ()
	{
		console.log("Connected to download !");
    	try{
			client.download('/www/g5/public/data', localDataFolder, {
				overwrite: 'all'
			}, function (result) {
				console.log(result);
			});
			votes = JSON.parse(fs.readFileSync(fileName));
			console.log("Done downloading votes !");
		} catch (err) {
			console.log("Error downloading votes ! "+err);
		}
	});
}

function uploadVotes()
{
	client = new ftpClient(config, options);
	client.connect(function ()
	{
		console.log("Connected to upload !");
		try{
			client.upload(['public/data/votes.json'], '/www/g5', {
				baseDir: '/www/g5	',
				overwrite: 'older'
			}, function (result) {
				console.log(result);
			});//*/
			console.log("Done uploading !");
    	} catch (err) {
			console.log("Error downloading votes ! "+err);
		}

	});
}

/*----------- parameters -----------*/

var fileName = 'public/data/votes.json';
var votes;
var curVote = -1;
var lang = 'fr';
var referendum = 'present';

/*----------- Launch server -----------*/

server.listen(port,function() {
    console.log("| Web Server listening port " + port);
	downloadVotes();
});

/*----------- Tools -----------*/

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

/*----------- Functions --------*/

function setReferendum(ref) {
    referendum = ref;
	console.log("setReferendum "+referendum);
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "setReferendum",
					referendum: referendum
				}));
		});
  	}
}

function setLang(l) {
	lang = l
	console.log("setLang "+lang);
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
}

function nextChart() {
	console.log("Next Chart");
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "nextChart"
				}));
		});
  	}
}

function prevChart() {
	console.log("Previous Chart");
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "prevChart"
				}));
		});
  	}

}

function setChart(i) {
	console.log("Set Chart "+parseInt(i));
	if(wss)
  	{
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "setChart",
					chart: i
				}));
		});
  	}

}

function clearVotes() {
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
}

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

/*----------- setLang receive -----------*/
app.post('/setLang', function (req, res) {
	console.log('| Server received /setLang '+req.body.lang);
	setLang(req.body.lang);
	res.send("ok");
})

/*----------- setReferendum receive -----------*/
app.post('/setReferendum', function (req, res) {
	console.log('| Server received /setReferendum '+req.body.referendum);
	setReferendum(req.body.referendum);
	res.send("ok");
})

/*------------ CLEAR VOTES ----------*/
app.post('/clearVotes', function(req, res) {
	console.log('| Server received /clearVotes');	
	//console.log('TODO CLEAR VOTES');
	clearVotes();
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

/*------------ BACKUP ----------*/
app.post('/backUp', function(req, res) {
	console.log('| Server received /backUp');
	uploadVotes();
	res.send("ok");
})

/*------------ SEND OSC ------------*/
/*app.post('/sendOSC', function(req, res) {
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
})//*/

app.post('/nextChart', function(req, res) {
	console.log('| Server received /nextChart');
	nextChart();
	res.send("ok");
});

app.post('/prevChart', function(req, res) {
	console.log('| Server received /prevChart');
	prevChart();
	res.send("ok");
});

/*----------- WS Server -----------*/

const wss = new WebSocketServer({
    server: server,
    autoAcceptConnections: true
});

wss.closeTimeout = 180 * 1000;

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    var msg = JSON.parse(message);
    
    switch(msg.command) {
    	case "setLang":
    		setLang(msg.lang);
    		break;
  		case "setReferendum":
    		setReferendum(msg.referendum);
    		break;
    	case "resetServer":
    		console.log("reset server");
    		setReferendum("present");
    		curVote = -1;
			console.log("set vote : "+curVote);
    		break;
    	case "clearVotes":
    		console.log("clear votes");
    		clearVotes();
    		break;
    	case "backupVotes":
    		console.log("backup votes");
    		uploadVotes();
    		break;
    	case "reloadVotes":
    		console.log("reload votes");
    		downloadVotes();
    		break;
    	case "nextChart":
    		nextChart();
    		break;
    	case "prevChart":
    		prevChart();
    		break;
    	case "setChart":
    		setChart(msg.chart);
    		break;
    	case "keepAlive":
    		console.log("I am alive !");
    		break;
  		default:
  			console.log('| WebSocket received : %s (ignored)', message);
  			break;
    }
  });
});
