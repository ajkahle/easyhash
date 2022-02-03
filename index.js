const express      = require('express')
const http         = require('http')
const arrayCompare = require('./lib/compare')
const Hash         = require('./lib/hash')
const Archive      = require('./lib/archive')
const app          = express()
const port         = process.env.PORT || 8000
const server       = http.Server(app)
const io = require('socket.io')(server)
require('dotenv').config()

const compare = new arrayCompare
const hash    = new Hash()
const archive = new Archive()

server.listen(port);
console.log("http server listening on %d", port);

app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/public/home.html');
});

io.on("listening",()=>{
  console.log('websocket listening')
})

io.on("connection",function(socket){
  socket.on("singleFile",(event)=>{
    console.log("INFO - Start Single File Job");
    socket.emit("progress",JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));

    var data = JSON.parse(event)

    hash
      .on("start",(msg)=>{
        console.log(msg)
      })
      .on("progress",(update)=>{
        socket.emit("progress",JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:update}))
      })
      .on("completed",(hashed)=>{
        archive
          .on("start",(msg)=>{
            console.log(msg)
          })
          .on("data",(d)=>{
            socket.emit("data",d)
          })
          .on("completed",(zip_file)=>{
            socket.emit("completed",{})
          })

        archive.archiveFiles(hashed)
      })
      .on("error",(err)=>{
        console.log(err)
        socket.emit("error",JSON.stringify({error:err}))
      })

      hash.hashFile(data.data,data.hashField)

  })

  socket.on("compareFiles",(event)=>{
    console.log("INFO - Start Compare Job");
    socket.emit("progress",JSON.stringify({id:"progress",type:"start",stage:"Hashing File"}));

    var data = JSON.parse(event)

    hash
      .on("start",(msg)=>{
        console.log(msg)
      })
      .on("progress",(update)=>{
        socket.emit("progress",JSON.stringify({id:"progress",type:"update",stage:"Hashing File",progress:update}))
      })
      .on("completed",(hashed)=>{
        compare.on("done",function(files){
          archive
            .on("start",(msg)=>{
              console.log(msg)
            })
            .on("data",(d)=>{
              socket.emit("data",d)
            })
            .on("completed",(zip_file)=>{
              socket.emit("completed",{})
            })

          archive.archiveFiles({my_unique:files.missing,other_unique:files.added,overlap:files.found})
        })

        compare.run(hashed.all_data,data.compareData,'hash',data.compareHashField)
      })
      .on("error",(err)=>{
        console.log(err)
        socket.emit("error",JSON.stringify({error:err}))
      })

      hash.hashFile(data.myData,data.myHashField)

  })

})
