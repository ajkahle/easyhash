const express      = require('express')
const http         = require('http')
const arrayCompare = require('./lib/compare')
const Hash         = require('./lib/hash')
const zip      = require('./lib/archive')
const app          = express()
const port         = process.env.PORT || 8080
const server       = http.Server(app)
const io           = require('socket.io')(server)
require('dotenv').config()

const Zipit        = require('zipit')
const async        = require('async');
const json2csv     = require('json2csv');

const compare = new arrayCompare
const hash    = new Hash()
// const archive = new Archive()

console.log(zip)

server.listen(port);
console.log("http server listening on %d", port);

app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/home.html');
});

io.once("listening",()=>{
  console.log('websocket listening')
})

io.on("connection",(socket) => {
  socket.on("singleFile",(event)=>{
    console.log("INFO - Start Single File Job");
    socket.emit("progress",JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));

    var data = JSON.parse(event)

    hash
      .once("start",(msg)=>{
        console.log(msg)
      })
      .once("progress",(update)=>{
        socket.emit("progress",JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:update}))
      })
      .once("completed",(hashed)=>{
        console.log("hash complete")

        zip(hashed,function(err,data){
          socket.emit("completed",data)
        })

      })
      .once("error",(err)=>{
        console.log(err)
        socket.emit("error",JSON.stringify({error:err}))
      })

      hash.hashFile(data.data,data.hashField)

  })

  socket.once("compareFiles",(event)=>{
    console.log("INFO - Start Compare Job");
    socket.emit("progress",JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));

    var data = JSON.parse(event)

    hash
      .once("start",(msg)=>{
        console.log(msg)
      })
      .once("progress",(update)=>{
        socket.emit("progress",JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:update}))
      })
      .once("completed",(hashed)=>{
        compare.once("done",function(files){
          zip(files,function(err,data){
            socket.emit("completed",data)
          })
        })

        compare.run(hashed.all_data,data.compareData,'hash',data.compareHashField)
      })
      .once("error",(err)=>{
        console.log(err)
        socket.emit("error",JSON.stringify({error:err}))
      })

      hash.hashFile(data.myData,data.myHashField)

  })

})
