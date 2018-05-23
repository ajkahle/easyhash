var express             = require('express'),
    connect             = require('connect'),
    url                 = require('url'),
    http                = require('http'),
    fs                  = require('fs'),
    arrayCompare        = require('./lib/compare'),
    compare             = new arrayCompare,
    archiver            = require('archiver'),
    WebSocketServer     = require('ws').Server,
    async               = require('async'),
    json2csv            = require('json2csv'),
    md5                 = require('md5');
    require('dotenv').config();

var app = express(),
    server = http.createServer(app),
    port = process.env.PORT || 5000;

server.listen(port);
console.log("http server listening on %d", port);

app.use(express.static(__dirname + '/public'));


app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/home.html');
});

var wss = new WebSocketServer({server: server});
wss.on("connection",function(ws){
  ws.on("message",function(event){
    var data = JSON.parse(event);
    switch(data.id){
      case "ping":
        ws.send(JSON.stringify({id:"pong"}));
      break;
      case "singleFile":
        console.log("INFO - Start Single File Job");
        var hashOnly = [];
        var parsed = [];
        ws.send(JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));
        async.eachOf(data.myData,function(row,i,callback){
          row.hash = md5(row[data.myHashField].toUpperCase());
          parsed.push(row);
          hashOnly.push({hash:md5(row[data.myHashField].toUpperCase())});
          if(i%1000===0){
            ws.send(JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:(i/data.myData.length)}));
          }
          callback();
        },function(err){
          console.log("INFO - Finished Hashing Single File Job");
          var keys = Object.keys(data.myData[0]),
              archive = archiver('zip',{
                store:true
              });

              ws.send(JSON.stringify({id:"progress",type:"done",stage:"archive"}));
              archive.append(json2csv({data:hashOnly,fields:Object.keys(hashOnly[0])}).toString("base64"),{name:'hash_only.csv'});
              archive.append(json2csv({data:parsed,fields:Object.keys(parsed[0])}).toString("base64"),{name:'all_data.csv'});

              archive.on('error', function(err) {
                console.log("ERROR - Archive");
                console.log(err);
                ws.send(JSON.stringify({id:"error",msg:err}));
              });

              archive.on('end',function(){
                console.log('INFO - ' + archive.pointer() + ' total bytes');
                console.log('INFO - Sent Single File Job');
                ws.send(JSON.stringify({id:"file",type:"done"}));
              });

              archive.on('data',function(chunk){
                ws.send(chunk);
              });

              archive.finalize();
            });
      break;
      case "file":
        console.log("INFO - Start Compare File Job");
        var hashOnly = [];
        var parsed = [];
        ws.send(JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));
        async.eachOf(data.myData,function(row,i,callback){
          row.hash = md5(row[data.myHashField].toUpperCase());
          parsed.push(row);
          if(i%1000===0){
            ws.send(JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:(i/data.myData.length)}));
          }
          callback();
        },function(err){
          console.log("INFO - Finished Hashing Compare File Job");
          ws.send(JSON.stringify({id:"progress",type:"done",stage:"Hashing File"}));
          var keys = Object.keys(data.myData[0]),
              archive = archiver('zip',{
                store:true
              });

          compare.on('start',function(data){
            ws.send(JSON.stringify({id:"progress",type:"done",stage:data.stage}));
          });

          compare.on('progress',function(data){
            if(data.progress%1000===0){
              ws.send(JSON.stringify({id:"progress",type:"update",stage:data.stage,progress:(data.progress/data.total)}));
            }
          });

          compare.on('error',function(err){
            console.log("ERROR - Compare");
            console.log(err);
            ws.send(JSON.stringify({id:"error",msg:err}));
          });

          compare.on('done',function(files){
            console.log("INFO - Finished Comparing Compare File Job");
            ws.send(JSON.stringify({id:"progress",type:"archive"}));
            archive.append(json2csv({data:files.found,fields:keys}).toString("base64"),{name:'overlap.csv'});
            archive.append(json2csv({data:files.missing,fields:keys}).toString("base64"),{name:'my_unique.csv'});
            archive.append(json2csv({data:files.added,fields:Object.keys(data.compareData[0])}).toString("base64"),{name:'other_unique.csv'});
          });

          compare.run(parsed,data.compareData,'hash',data.compareHashField);

          archive.on('error', function(err) {
            console.log("ERROR - Archive");
            console.log(err);
            ws.send(JSON.stringify({id:"error",msg:err}));
          });

          archive.on('end',function(){
            console.log(archive.pointer() + ' total bytes');
            console.log("INFO - Sent Compare File Job");
            ws.send(JSON.stringify({id:"file",type:"done"}));
          });

          archive.on('data',function(chunk){
            ws.send(chunk);
          });

          archive.finalize();
        });
      break;
    }
  });
});
