var host = location.origin.replace(/^http/, 'ws'),
    ws = new WebSocket(host);

ws.onopen = function(){
  console.log("INFO - Connection opened");
  ws.send(JSON.stringify({id:"ping"}));
};

$(document).ready(function(){
  $('input[type=file]').change(function(d){
    var thisId = $(this).attr('id');
    var file = document.getElementById(thisId).files[0];
    Papa.parse(file,{
      worker:true,
      header:true,
      preview:1,
      complete:function(e){
        $("#"+thisId+"-hash")
          .empty();
        $.each(e.meta.fields,function(key,value){
          $("#"+thisId+"-hash")
            .attr("disabled",false)
            .append($("<option></option>")
              .attr("value",value)
              .text(value));
            });
        if(document.getElementById('myFile').value&&document.getElementById('compareFile').value){
          $('#send')
            .attr("disabled",false);
        }
        if(document.getElementById('singleFile').value){
          $('#singleSend')
            .attr("disabled",false);
        }
      }
    });
  });

  $('#singleSend').click(function(d){
    $('#progress-modal').modal({
      backdrop:"static",
      keyboard:false
    });
    $('#progressStage').text("Preparing File");
    $('.progress-bar').width("0%");

    var myFile = document.getElementById('singleFile').files[0],
        parsedFile = [];

    Papa.parse(myFile,{
      worker:true,
      header:true,
      skipEmptyLines:true,
      chunkSize:1024,
      step:function(e){
        $('#progressStage').text("Preparing File "+parseInt(e.meta.cursor/myFile.size * 100)+"%");
        $('.progress-bar').width(parseInt(e.meta.cursor/myFile.size * 100)+"%");
        parsedFile.push(e.data[0]);
      },
      complete:function(my){
        ws.send(JSON.stringify({id:"singleFile",myData:parsedFile,myHashField:$('#singleFile-hash').val()}));
      }
    });
  });

  $('#send').click(function(d){
    $('#progress-modal').modal({
      backdrop:"static",
      keyboard:false
    });
    $('#progressStage').text("Preparing My File");
    $('.progress-bar').width("0%");
    var myFile        = document.getElementById('myFile').files[0],
        compareFile   = document.getElementById('compareFile').files[0],
        myParsedFile  = [],
        compareParsedFile = [];
    Papa.parse(myFile,{
      worker:true,
      header:true,
      skipEmptyLines:true,
      chunkSize:1024,
      step:function(e){
        $('#progressStage').text("Preparing My File "+parseInt(e.meta.cursor/myFile.size * 100)+"%");
        $('.progress-bar').width(parseInt(e.meta.cursor/myFile.size * 100)+"%");
        myParsedFile.push(e.data[0]);
      },
      complete:function(my){
        $('#progressStage').text("Preparing Compare File");
        $('.progress-bar').width("0%");
        Papa.parse(compareFile,{
          worker:true,
          header:true,
          skipEmptyLines:true,
          step:function(e){
            $('#progressStage').text("Preparing Compare File "+parseInt(e.meta.cursor/compareFile.size * 100)+"%");
            $('.progress-bar').width(parseInt(e.meta.cursor/compareFile.size * 100)+"%");
            compareParsedFile.push(e.data[0]);
          },
          complete:function(compare){
            ws.send(JSON.stringify({id:"file",myData:myParsedFile,myHashField:$('#myFile-hash').val(),compareData:compareParsedFile,compareHashField:$('#compareFile-hash').val()}));
          }
        });
      }
    });
  });
});

var blobCombine = [];

ws.onmessage = function(event){
  switch(typeof event.data){
    case "object":
      blobCombine.push(event.data);
    break;
    case "string":
      var data = JSON.parse(event.data);
      switch(data.id){
        case "pong":
          setTimeout(function(){
            ws.send(JSON.stringify({id:"ping"}));
          },20000);
        break;
        case "error":
          console.log("ERROR - Server side");
          $('#error').modal({
            keyboard:false,
            backdrop:"static"
          });

          $('#error-msg').text(data.msg);

          $('#errorButton').on("click",function(){
            location.reload();
          });
        break;
        case "file":
          switch(data.type){
            case "done":
              $('.progress-bar').width("100%");
              $('#progressStage').text("Done!");
              var file = new Blob(blobCombine);
              var encodedUri = URL.createObjectURL(file);
              var link = document.createElement('a');
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "files.zip");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  $('input[type=file]')
                    .val('');
                  $('.bootstrap-filestyle>input[type=text]')
                    .val('');
                  $('select').empty()
                    .attr("disabled","disabled");
                  $('button')
                    .attr("disabled","disabled");

                setTimeout(function(){
                  $('#progress-modal').modal('hide');
                },3000);
            break;
          }
        break;
        case "progress":
          switch(data.type){
            case "archive":
              $('.progress-bar').width("100%");
              $('#progressStage').text("Finalizing Files");
            break;
            case "start":
              $('.progress-bar').width("0%");
              $('#progressStage').text(data.stage+" "+parseInt((data.progress*100))+"%");
            break;
            case "done":
              $('.progress-bar').width("100%");
              $('#progressStage').text(data.stage+" 100%");
            break;
            case "update":
              $('.progress-bar').width((data.progress*100)+"%");
              $('#progressStage').text(data.stage+" "+parseInt((data.progress*100))+"%");
            break;
          }
        break;
      }
    break;
  }
};

ws.onclose = function(event){
  console.log("INFO - Connection closed");
  $('#warning').modal({
    keyboard:false,
    backdrop:"static"
  });

  $('#warningButton').on("click",function(){
    location.reload();
  });
};
