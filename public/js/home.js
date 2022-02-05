const socket = io();

socket.on("connect",()=>{
  console.log(socket.connected)
})

$(window).resize(function(){
  $('.headerRow').matchHeight();
  $('.contentRow').matchHeight();
  $('.instructionsRow').matchHeight();
})

$(document).ready(function(){
  $('.headerRow').matchHeight();
  $('.contentRow').matchHeight();
  $('.instructionsRow').matchHeight();
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
      complete:function(){
        socket.emit("singleFile",JSON.stringify({id:"singleFile",data:parsedFile,hashField:$('#singleFile-hash').val()}));
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
            socket.emit("compareFiles",JSON.stringify({id:"file",myData:myParsedFile,myHashField:$('#myFile-hash').val(),compareData:compareParsedFile,compareHashField:$('#compareFile-hash').val()}));
          }
        });
      }
    });
  });
});

var blobCombine = [];

socket.on("start",(msg)=>{
  console.log(msg)
})

socket.on("progress",(msg)=>{
  console.log(msg)

})

socket.on("error",(msg)=>{
  console.log("ERROR - Server side");
  $('#error').modal({
    keyboard:false,
    backdrop:"static"
  });

  $('#error-msg').text(data.msg);

  $('#errorButton').on("click",function(){
    location.reload();
  });
})

socket.on("data",(data)=>{
  console.log("data")
})

socket.on("completed",(msg)=>{
  console.log("completed")
  console.log(msg)
  console.log(new Blob([msg]))
  console.log(URL.createObjectURL(new Blob([msg])))

  $('.progress-bar').width("100%");
  $('#progressStage').text("Done!");
  var file = new Blob([msg]);
  var encodedUri = URL.createObjectURL(new Blob([msg]));
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
})

socket.on("disconnect",()=>{
  console.log("INFO - Connection closed");
  $('#warning').modal({
    keyboard:false,
    backdrop:"static"
  });

  $('#warningButton').on("click",function(){
    location.reload();
  });
})
