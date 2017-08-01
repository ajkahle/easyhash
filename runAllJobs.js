var async           = require('async'),
    client          = require('./lib/database.js'),
    postExports     = require('./routes/export/postExports'),
    postImports     = require('./routes/import/postImports'),
    moveData        = require('./lib/moveData.js'),
    firebase        = require('./lib/firebase.js');

firebase.db.ref('/jobs').once('value',function(snapshot){
  var jobs = snapshot.val();

  console.log("INFO - Running All Jobs Manually")

  async.forEachOfLimit(Object.keys(jobs),1,function(job,i,cb){
    switch(job.data.direction){
      case "export":
        postExports.run(job.data,function(err){
          cb(err);
        });
      break;
      case "import":
        postImports.run(job.data,function(err){
          cb(err);
        });
      break;
    }
  },function(err){
    if(err){
      console.log("ERROR - Running All Jobs Manually")
      console.log(err)
    }else{
      console.log("INFO - Successfully Done Running All Jobs Manually")
    }
  })
})

/*
async.eachSeries(Object.keys(jobs),function(d,cb){
  var data = jobs[d].data,
      index = jobs[d].data.sheet.lastIndexOf('_'),
      sheet = jobs[d].data.sheet.substring(0,index),
      worksheet = jobs[d].data.sheet.substring(index+1)

  data.worksheet = worksheet
  data.sheet = sheet
  data.job_name = d
  data.job_type = 'recurring'
  data.overwrite = 'Overwrite Overlap'
  data.range = 'A1'
  data.cron = jobs[d].pattern
  data.owner = jobs[d].data.user_id
  data.object = 'sheet'
  data.direction = 'export'

  async.waterfall([
    function(callback){
      moveData.logging.createJob(
        data,
        'export',
        function(err,job_id){
          if(job_id&&!err){
            console.log("INFO - Recurring Job Log Added");
            callback(err,job_id);
          }else{
            console.log("ERROR - Recurring Job Log Added");
            callback(err);
          }
      });
    },
    function(job_id,callback){
      firebase.cron.addJob(
          job_id,
          data.cron,
          data,
          function(err){
            if(err){
              console.log("ERROR - Recurring Job Firebase Added");
            }else{
              console.log("INFO - Recurring Job Firebase Added");
            }
            callback(err);
      });
    }
  ],function(err){
    if(err){
      console.log("ERROR - Recurring Job");
    }else{
      console.log("INFO - Recurring Job Done");
    }
    cb(err);
  });
},function(err){
  if(err){
    console.log(err)
  }else{
    console.log("Job Import Done")
  }
  process.exit()
});
*/
