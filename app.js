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

app.get('/address.html',function(req,res){
      res.sendFile(__dirname + "/public/address.html");
});

app.get('/votes.json',function(req,res){
      res.sendFile(__dirname + "/public/votes.json");
});


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

              /*wss.clients.forEach(function each(client) {
                if (client !== wss && client.readyState === WebSocket.OPEN) {
                  console.log("Sending new img upload");
                  client.send(
                    JSON.stringify(
                    {
                      type: "newimage",
                      stage: currentStage,
                      standbyMsg: file
                    }));
                }
              });//*/
          }
          res.end( JSON.stringify( response ) );
       });
   });
});

var rawvotes = fs.readFileSync('public/votes.json');
var votes = JSON.parse(rawvotes);
console.log(votes);

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
  	//console.log(votes);
  	
  } else {
    console.log("* Error: invalid vote received");  
  }
  
  res.end("ok");
})

/*----------- stage receive -----------*/
app.post('/stage', function (req, res) {
  	console.log('| Server received /stage '+req.body.stage);
  
  	if(wss)
  	{
		currentStage = req.body.stage;
		currentStandbyMessage = req.body.standbyMsg;

		console.log("- BROADCAST " + currentStage);
		// Broadcast
		wss.clients.forEach(function each(client) {
			client.send(
				JSON.stringify(
				{
					charset : 'utf8mb4', 
					type: "changeState",
					stage: currentStage,
					standbyMsg: currentStandbyMessage
				}));
		});
  	}

  res.end("ok");
})

/*----------- WS Server -----------*/

const wss = new WebSocketServer({
    server: server,
    autoAcceptConnections: true
});

wss.closeTimeout = 180 * 1000;

var currentStage = -1;
var currentStandbyMessage = "Take a Selfie";

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('| WebSocket received : %s', message);

    var msg = JSON.parse(message);
    
    switch(msg.type) {
		case "broadcast":
        	currentStage = msg.stage;
        	currentStandbyMessage = msg.standbyMsg;

	        console.log("- BROADCAST " + msg.stage);
			// Broadcast
    	    wss.clients.forEach(function each(client) {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					//console.log("Sending: " + currentStage);
					client.send(
						JSON.stringify(
						{
							charset : 'utf8mb4', 
							type: "changeState",
							stage: currentStage,
							standbyMsg: currentStandbyMessage
						}));
				}
        	});
			break;
  		default:
  			console.log('* ignored : '+msg.type);
  			break;
    }



  });
});
