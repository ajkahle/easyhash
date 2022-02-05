const { EventEmitter } = require('events');
const md5              = require('md5');
const async            = require('async');

class Hash extends EventEmitter {
  constructor() {
        super();
    }

  hashFile(data,hashField) {

    const e = this

    console.log("hashing func started")
    e.emit('start',"Hashing Your File");

    let hashOnly = []
    let parsed   = []

    async.eachOf(data,function(row,i,callback){
      row.hash = md5(row[hashField].toUpperCase());
      parsed.push(row);
      hashOnly.push({hash:md5(row[hashField].toUpperCase())});
      if(i%1000===0){
        e.emit('progress',{progress:(i/data.length)})
      }
      callback();
    },function(err){
      e.emit('completed',{hash_only:hashOnly,all_data:parsed})
    })
  }
}

module.exports = Hash
