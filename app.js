const express = require("express");
const http = require("http");
const https = require("https");
const serveIndex = require("serve-index");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { Server: WebSocketServer } = WebSocket;

const app = express();
const server = http.createServer(app);

/* PARAMETERS */

// use alternate localhost and the port Heroku assigns to $PORT
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(publicDir, "data");
const uploadsDir = path.join(__dirname, "uploads");
const fileName = path.join(dataDir, "votes.json");
const backupFileName = path.join(dataDir, "backup.json");
const remoteVotesUrl = "https://www.grabugemusic.fr/g5/public/data/votes.json";
const remoteBackupUrl = "https://www.grabugemusic.fr/g5/public/data/backupVotes.php";

let votes = {};
let curVote = -1;
let lang = 'fr';
let referendum = 'present';

function sendLocalizedFile(res, file) {
	res.sendFile(path.join(publicDir, lang, file));
}

app.get('/', function(req, res) {
	sendLocalizedFile(res, 'index.html');
});

app.get('/index.html', function(req, res) {
	sendLocalizedFile(res, 'index.html');
});

app.get('/id_animal.html', function(req, res) {
	sendLocalizedFile(res, 'id_animal.html');
});

app.get('/id_vegetal.html', function(req, res) {
	sendLocalizedFile(res, 'id_vegetal.html');
});

app.get('/id_mineral.html', function(req, res) {
	sendLocalizedFile(res, 'id_mineral.html');
});

app.get('/id_human.html', function(req, res) {
	sendLocalizedFile(res, 'id_human.html');
});

app.get('/id_machine.html', function(req, res) {
	sendLocalizedFile(res, 'id_machine.html');
});

app.get('/referendum.html', function(req, res) {
	res.sendFile(path.join(publicDir, 'referendum.html'));
});

app.get('/controller.html', function(req, res) {
	res.sendFile(path.join(publicDir, 'controller.html'));
});

app.get('/votes.json', function(req, res) {
	res.sendFile(fileName);
});

app.get('/backup.json', function(req, res) {
	res.sendFile(backupFileName);
});

app.get('/rocio.html', function(req, res) {
	res.sendFile(path.join(publicDir, 'rocio.html'));
});

app.get('/results.html', function(req, res) {
	res.sendFile(path.join(publicDir, 'results.html'));
});

app.use('/scripts', express.static(path.join(__dirname, 'node_modules', 'chart.js', 'dist')));

/*----------- Static Files -----------*/
app.use('/vendor', express.static(path.join(publicDir, 'vendor')));
app.use('/css', express.static(path.join(publicDir, 'css')));
app.use('/js', express.static(path.join(publicDir, 'js')));
app.use('/img', express.static(path.join(publicDir, 'img')));
app.use('/data', express.static(dataDir));

app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', serveIndex(uploadsDir));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/*----------- Download/Upload votes -----------*/

const localDataFolder = path.dirname(fs.realpathSync(__filename)) + '/public/data';
console.log('local data folder "', localDataFolder, '"');

function saveVotes() {
	const jsonString = JSON.stringify(votes, null, 2);
	fs.writeFileSync(fileName, jsonString);
	console.log('Successfully wrote file');
}

function requestJson(url, options, body) {
	return new Promise(function(resolve, reject) {
		const parsedUrl = new URL(url);
		const requestOptions = {
			method: options && options.method ? options.method : 'GET',
			hostname: parsedUrl.hostname,
			port: parsedUrl.port || 443,
			path: parsedUrl.pathname + parsedUrl.search,
			headers: options && options.headers ? options.headers : {}
		};

		const req = https.request(requestOptions, function(response) {
			let rawData = '';
			response.setEncoding('utf8');
			response.on('data', function(chunk) {
				rawData += chunk;
			});
			response.on('end', function() {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					reject(new Error('Request failed with status ' + response.statusCode));
					return;
				}

				try {
					resolve(rawData ? JSON.parse(rawData) : {});
				} catch (error) {
					reject(error);
				}
			});
		});

		req.on('error', reject);

		if (body) {
			req.write(body);
		}

		req.end();
	});
}

async function downloadVotes() {
	try {
		votes = await requestJson(remoteVotesUrl, {
			headers: {
				'Cache-Control': 'no-cache'
			}
		});
		console.log('"' + remoteVotesUrl + '" loaded.');
		saveVotes();
	} catch (error) {
		console.error('Error downloading votes', error);
		if (fs.existsSync(fileName)) {
			votes = JSON.parse(fs.readFileSync(fileName, 'utf8'));
			console.log('Loaded local votes fallback.');
		}
	}
}

async function uploadVotes() {
	try {
		const payload = JSON.stringify(votes);
		const body = await requestJson(remoteBackupUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload)
			}
		}, payload);

		if (body.success) {
			console.log('Done uploading votes ! ' + body.message + ' ' + body.date);
		} else {
			console.log('Error uploading votes ! ' + body.message + ' ' + body.date);
		}
	} catch (error) {
		console.error('Error uploading votes', error);
	}
}

/*----------- Launch server -----------*/

server.listen(port,function() {
    console.log("| Web Server listening port " + port);
	downloadVotes();
});

/*----------- Tools -----------*/

function sanitizeUploadName(name) {
	return String(name || 'upload').replace(/\s+/g, '_');
}

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
	});
	saveVotes();
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
  		var ref = votes[_ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == _vote)
  			{
  				q['options'].forEach(function(o) {
  					if(o['id'] == _value)
  					{
  						o['votes'] += 1;
  					}
  				});
  			}
  		});
  		saveVotes();
  	} else {
  		console.log("not found : "+_ref);
  	}
}

function addVote(_ref, _vote, _value) {
	console.log('- addVote : '+_ref +' '+_vote +' '+ _value);
  	if(votes.hasOwnProperty(_ref))
  	{
  		var ref = votes[_ref]['content'];
  		ref.forEach(function(q) {
  			if(q['id'] == _vote)
  			{
  				q['votes'] += 1;
  				q['growth'] += parseFloat(_value);
  			}
  		});
  		saveVotes();
  	} else {
  		console.log("not found : "+_ref);
  	}
}

function addVoteMulti(_ref, _id, _vote, _value) {
	console.log('- addVoteMulti : '+_ref +' '+_id+' '+_vote +' '+ _value);
  	if(votes.hasOwnProperty(_ref))
  	{
  		var ref = votes[_ref]['content'];
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
  		saveVotes();
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
   var name = sanitizeUploadName(req.body.name);
   var file = path.join(uploadsDir, name + /*"_" + timeToAppend +*/ "." + type);
   fs.readFile(req.file.path, function (err, data) {
        if (err) {
             console.error(err);
             res.end(JSON.stringify({
                  message: 'Sorry, file could not be uploaded.',
                  filename: req.file.originalname
             }));
             return;
        }

        fs.writeFile(file, data, function (err) {
         var response;
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
    var msg;

    try {
    	msg = JSON.parse(message);
    } catch (error) {
    	console.log('| Invalid WebSocket JSON received : %s', message);
    	return;
    }
    
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
			//console.log('* getUsers');
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
