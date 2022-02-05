const Zipit        = require('zipit')
const async        = require('async');
const json2csv     = require('json2csv');

const zip = (data,callback)=>{

  async.map(Object.keys(data),(file,cb)=>{
    cb(null,{
      name:file+'.csv',
      data:json2csv.parse(
            data[file],
            {fields:Object.keys(data[file].filter(Boolean)[0])}
          ).toString("base64")
        }
      )


  },(err,d)=>{
    if(err){
      callback(err)
    }else{
      Zipit({
        input:d
      },function(err,data){
        return callback(err,data)
      })
    }
  })
}

module.exports = zip
