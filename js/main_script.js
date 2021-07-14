const canv = document.querySelector('.canv');
const cam = document.querySelector('.camera');
if(params.mode!== undefined){
  toggle(document.querySelector(`.${params.mode}`))
  console.log(params);
} else{
  toggle(canv);
}
function toggle(page) {
    canv.style.display = 'none';
    cam.style.display = 'none';
    page.style.display = 'block';
}

//DTS connection
async function showPhotos() {
    var spivotImgConnection = null;
    var AUTH_SERVER_URL = 'https://ai.sqilsoft.by/dts';

    if (spivotImgConnection !== null) {
        return
    }
    spivotImgConnection = io('https://ai.sqilsoft.by', {
        path: '/dts/ws/socket.io',
        transports: ['websocket']
    });


    //Get QR-Code
    spivotImgConnection.on('connect', async () => {
        console.log('Connected');
        const response = await fetch(
            `${AUTH_SERVER_URL}/${spivotImgConnection.id}/join/qr-generate/`);
        if (response.status === 200) {
            const responseData = await response.json();
            var b64Image = responseData.image;
            var imgBox = document.getElementById('qr-auth-img');
            imgBox.src = `data:image/jpeg;base64, ${b64Image}`;
            showImgBox('qr-auth-img');

        }
    });

    //Get message from first client

    spivotImgConnection.on('message', (data) => {
        try {
            hideImgBox('qr-auth-img');
            if(data.type == 'connected'){
              localStorage.setItem(obj.LAST_USED_SOCKET_HASH_STORAGE_NAME, data.hash);
              console.log(data);
            } else {
                console.log(data);
                estimateHands(data);
            }
            
           
        } catch (SyntaxError) {
            console.error(SyntaxError);
        }
    });              
}




//Show and hide box with QR
function showImgBox(elemId) {
    document.getElementById(elemId).classList.remove('hidden');
    document.getElementById(elemId).classList.add('show');
}

function hideImgBox(elemId) {
    document.getElementById(elemId).classList.remove('show');
    document.getElementById(elemId).classList.add('hidden');
}


//RESET QR


function onload() {
    document.getElementById('body').addEventListener("click", closeQRAuthImg);
}

function closeQRAuthImg() {
    if (document.getElementById('qr-auth-img').classList.contains('show')) {
        hideImgBox('qr-auth-img');
        if (qrAuth.CONNECTION) {
            qrAuth.CONNECTION.disconnect();
            qrAuth.CONNECTION = null;
        }
        if (spivotImgConnection) {
            spivotImgConnection.disconnect();
            spivotImgConnection = null;
        }
    }
}


const obj = {
    webSocket: null,
    LAST_USED_SOCKET_HASH_STORAGE_NAME: 'LocalUsedSocketHash',
    isWebSocketConnected: null,
  
    //Connect to socket room
    connectToWebSocket(hash) {
        return new Promise((resolve, error) => {
            this.webSocket = io('https://ai.sqilsoft.by', {
                path: '/dts/ws/socket.io',
                transports: ['websocket']
            });
  
            // save last used socket hash
            if (typeof hash !== 'undefined' && hash !== null){
              localStorage.setItem(this.LAST_USED_SOCKET_HASH_STORAGE_NAME, hash);
            }
            
            //connect on canvas page
            this.webSocket.on('message', (data) => {
              try {
                  hideImgBox('qr-auth-img');
                  if(data.type == 'connected'){
                    localStorage.setItem(obj.LAST_USED_SOCKET_HASH_STORAGE_NAME, data.hash);
                    console.log(data);
                  } else {
                      console.log(data);
                      estimateHands(data);
                  }
                  
                 
              } catch (SyntaxError) {
                  console.error(SyntaxError);
              }
            });

            this.webSocket.on(
                'connect',
                event => {
                    console.log('Connected');
                    console.log(event);
  
                    this.isWebSocketConnected = true;
                    // join socket "room"
                    this.webSocket.emit('join', hash);
  
                    // send callback about successfull connection
                    this.webSocket.emit(
                        'message', {
                            type: 'connected',
                            success: true,
                            hash: hash
                        }
                    );
                    
                    //this.showToastAlert('Connected', 2500);
                    /*this.sendImageUsingSocket()
                        .then(resultData => resolve(resultData))
                        .catch(errorData => error(errorData));*/
  
                    resolve('Connected');
                }
            );
            
            const width = document.querySelector('.result').innerHTML;

            
        });

    },
      //Connect to socket room using localStorage
    connectToWebSocketAuto(){
      this.connectToWebSocket(localStorage.getItem(this.LAST_USED_SOCKET_HASH_STORAGE_NAME));
  
    },
    
    //Sending data to client with canvas
    sendThis(data){ if(this.webSocket == null || data == null){
        return
        }else{
            this.webSocket.emit(
                'message', {
                    type: 'data',
                    x: data.x,
                    y: data.y,
                    name: data.name
                }
            );
        }

    }
}
if(typeof localStorage.getItem(obj.LAST_USED_SOCKET_HASH_STORAGE_NAME)!== 'undefined' && localStorage.getItem(obj.LAST_USED_SOCKET_HASH_STORAGE_NAME) !== null){
  obj.connectToWebSocketAuto()
}
const dnp = document.getElementById('inp');
var sensetive = document.getElementById('sensetive');


const load = document.querySelector('.load');
const canvasDraw = document.getElementById("draw-canvas"),
  context = canvasDraw.getContext("2d");
const redPoint = document.getElementById("redPointCanvas"),
  contextRed = redPoint.getContext("2d");


//clear  draw canvas
function clear(cds, width, height) {
  cds.beginPath();
  cds.clearRect(0, 0, width, height);
  cds.closePath();
}
redPoint.width = window.screen.width;
redPoint.height = window.screen.height;
canvasDraw.width = window.screen.width;
canvasDraw.height = window.screen.height;

//stop draw after thumbCurl == false
function stopDraw(cds) {
  cds.beginPath()
  cds.closePath();
}

var index = 0;
var toggled = true;
var tempHeight = 0;
var tempWidth = 0;
var pointLeft = redPoint.width * 0.5;
var pointTop = redPoint.height * 0.5;
// main estimation loop
const estimateHands = async (data) => {
  // clear canvas with cursor
    contextRed.clearRect(0, 0, redPoint.width, redPoint.height);

    var moveWidth =  data.x - tempWidth;
    var moveHeight =  data.y - tempHeight;
    tempWidth = data.x;
    tempHeight = data.y;

    if (data.name == "thumbs_up") {
      clear(context, redPoint.width, redPoint.height);
      toggled = false;
    }

    //toggle thumbCurl only one's per second
    index++;
    if (data.name == "thumbCurl" && index >= 30) {
      if (toggled == false) {
        toggled = true;
      } else {
        toggled = false;
      }
      index = 0;
    }
    //ignore jumping cursor if hand appears too far from previous  point
    if (moveWidth > 30 || moveHeight > 30 || moveWidth < -30 || moveHeight < -30) {
      pointLeft += 0;
      pointTop += 0;
    } else {
      pointLeft += moveWidth * sensetive.value;
      pointTop += moveHeight * sensetive.value;
      console.log(sensetive.value)
    }
    

    //doesn't let to cross window view line
    if (toggled == true) {
        if (pointLeft < 0) {
          pointLeft = 0;
          drawSmth(context, 0, pointTop);
          drawPoint(contextRed, 0, pointTop, 5, 'red');
          context.moveTo(0, pointTop);
        } else if (pointLeft > canvasDraw.width) {
          pointLeft = canvasDraw.width;
          drawSmth(context, canvasDraw.width, pointTop);
          drawPoint(contextRed, canvasDraw.width, pointTop, 5, 'red');
          context.moveTo(canvasDraw.width, pointTop);
        } else if (pointTop < 0) {
          pointTop = 0;
          drawSmth(context, pointLeft, 0);
          drawPoint(contextRed, pointLeft, 0, 5, 'green');
          context.moveTo(pointLeft, 0);
        } else if (pointTop > canvasDraw.height) {
          pointTop = canvasDraw.height;
          drawSmth(context, pointLeft, canvasDraw.height);
          drawPoint(contextRed, pointLeft, canvasDraw.height, 5, 'green');
          context.moveTo(pointLeft, canvasDraw.height);
        } else if (pointLeft < 0 && pointTop < 0) {
          drawSmth(context, 0, 0);
          pointLeft = 0;
          pointTop = 0;
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else if (pointLeft > canvasDraw.width && pointTop > canvasDraw.height) {
          pointTop = canvasDraw.height;
          pointLeft = canvasDraw.width;
          drawSmth(context, 0, 0);
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else {
          drawSmth(context, pointLeft, pointTop);
          drawPoint(contextRed, pointLeft, pointTop, 5, 'red');
          context.moveTo(pointLeft, pointTop);
        }
      } else {
        if (pointLeft < 0) {
          pointLeft = 0;
          stopDraw(context);
          drawPoint(contextRed, 0, pointTop, 5, 'red');
          context.moveTo(0, pointTop);
        } else if (pointLeft > canvasDraw.width) {
          pointLeft = canvasDraw.width;
          stopDraw(context);
          drawPoint(contextRed, canvasDraw.width, pointTop, 5, 'red');
          context.moveTo(canvasDraw.width, pointTop);
        } else if (pointTop < 0) {
          pointTop = 0;
          stopDraw(context);
          drawPoint(contextRed, pointLeft, 0, 5, 'green');
          context.moveTo(pointLeft, 0);
        } else if (pointTop > canvasDraw.height) {
          pointTop = canvasDraw.height;
          stopDraw(context);
          drawPoint(contextRed, pointLeft, canvasDraw.height, 5, 'green');
          context.moveTo(pointLeft, canvasDraw.height);
        } else if (pointLeft < 0 && pointTop < 0) {
          stopDraw(context);
          pointLeft = 0;
          pointTop = 0;
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else if (pointLeft > canvasDraw.width && pointTop > canvasDraw.height) {
          pointTop = canvasDraw.height;
          pointLeft = canvasDraw.width;
          stopDraw(context);
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else {
          stopDraw(context);
          drawPoint(contextRed, pointLeft, pointTop, 5, 'red');
          context.moveTo(pointLeft, pointTop);
        }
      }


      drawPoint(contextRed, pointLeft, pointTop, 5, 'red');

      
      

    // draw colored dots at each predicted joint position 
  }
  console.log("Starting predictions");

  

//draw line 

function drawSmth(cont, x, y) {
  cont.lineTo(x, y);
  cont.stroke();
}

// draw cursor point 

function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}
const video = document.querySelector("#pose-video");


