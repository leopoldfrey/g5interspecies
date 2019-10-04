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
	console.log("- setReferendum "+referendum);
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
	console.log("- setLang "+lang);
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
	console.log("- nextChart");
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
	console.log("- previousChart");
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
	console.log("- setChart "+parseInt(i));
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

function gotoVote(v) {
	curVote = v;
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
}

function newVote(_ref, _vote, _value) {
	console.log('- newVote : '+_ref +' '+_vote +' '+ _value);
  	if(votes.hasOwnProperty(_ref))
  	{
  		ref = votes[_ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == _vote)
  			{
  				q['options'].forEach(function(o) {
  					if(o['id'] == _value)
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
  	} else {
  		console.log("not found : "+_ref);
  	}
}

function addVote(_ref, _vote, _value) {
	console.log('- addVote : '+_ref +' '+_vote +' '+ _value);
  	if(votes.hasOwnProperty(_ref))
  	{
  		ref = votes[_ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == _vote)
  			{
  				q['votes'] += 1;
  				q['growth'] += parseFloat(_value);
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
  		console.log("not found : "+_ref);
  	}
}

function addVoteMulti(_ref, _id, _vote, _value) {
	console.log('- addVoteMulti : '+_ref +' '+_id+' '+_vote +' '+ _value);
  	if(votes.hasOwnProperty(_ref))
  	{
  		ref = votes[_ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == _id)
  			{
  				q['options'].forEach(function(o) {
  					if(o['id'] == _vote)
  					{
  						o['votes'] += 1;
  						o['growth'] += parseFloat(_value);
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
  		console.log("not found : "+_ref);
  	}
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

/*------------ I AM NEW WHERE TO ----------*/
app.post('/iAmNewWheteTo', function(req, res) {
	console.log('| Server received /iAmNewWheteTo IT SHOULD NOT !!!!');
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
    		console.log("* reset server");
    		setReferendum("present");
    		curVote = -1;
			console.log("- set vote : "+curVote);
    		break;
    	case "clearVotes":
    		console.log("* clear votes");
    		clearVotes();
    		break;
    	case "backupVotes":
    		console.log("* backup votes");
    		uploadVotes();
    		break;
    	case "reloadVotes":
    		console.log("* reload votes");
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
    		console.log("* I am alive !");
    		break;
    	case "iAmNewWheteTo":
    		console.log('* iAmNewWheteTo');
  			ws.send(JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "goto",
					lang: lang,
					referendum: referendum
				}));
			break;
		case "getUsers":
			console.log('* getUsers');
  			ws.send(JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "users",
					users: wss.clients.size
				}));
			break;
		case "gotoVote":
			console.log('* gotoVote '+msg.vote);
			gotoVote(msg.vote);
			break;
		case "newVote":
			newVote(msg.ref, msg.vote, msg.value);
			ws.send(JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "newVoteOk"
				}));
			break;
  		case "addVote":
			addVote(msg.ref, msg.vote, msg.value);
			ws.send(JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "addVoteOk"
				}));
			break;
  		case "addVoteMulti":
			addVoteMulti(msg.ref, msg.id, msg.vote, msg.value);
			ws.send(JSON.stringify(
				{
					charset : 'utf8mb4', 
					command: "addVoteMultiOk"
				}));
			break;
  		default:
  			console.log('| WebSocket received : %s (ignored)', message);
  			break;
    }
  });
});
