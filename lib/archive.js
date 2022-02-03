const archiver     = require('archiver');
const EventEmitter = require('events').EventEmitter;
const json2csv     = require('json2csv');
const async        = require('async');

class Archive extends EventEmitter {

  archiveFiles(data) {

    const e = this

    e.emit('start',{stage:"Archiving Files"});

    let archive = archiver('zip',{
      store:true
    });

    console.log(data)

    async.eachOf(data,function(file,i,callback){
      console.log(i)
      archive.append(

        json2csv.parse(
            file,
            {fields:Object.keys(file.filter(Boolean)[0])}
          ).toString("base64"),

        {name:i+'.csv'}

      );
      callback();
    },function(err){
        archive.on('end',()=>{
          e.emit("completed",{})
        })

        archive.on("data",d=>{
          e.emit("data",d)
        })

        archive.finalize()
    })

  }
}

module.exports = Archive
