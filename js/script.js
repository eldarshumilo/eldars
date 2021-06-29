const load = document.querySelector('.load')
const res = document.querySelector(".result");
res.innerHTML='';


const video = document.querySelector("#pose-video");
const widthVideo = video.offsetWidth;
const heightVideo = video.offsetHeight;
var tempHeight = 0;
var tempWidth = 0;

var index = 0;
const config = {
  video: {
    width: widthVideo,
    height: heightVideo,
    fps: 30
  }
};

var pointLeft = config.video.width * 0.5;
var pointTop = config.video.height * 0.5;
const canvas = document.querySelector("#pose-canvas");
  canvas.width = config.video.width;
  canvas.height = config.video.height;
 

const landmarkColors = {
  thumb: 'red',
  indexFinger: 'blue',
  middleFinger: 'yellow',
  ringFinger: 'green',
  pinky: 'pink',
  palmBase: 'white'

};
const canvasDraw = document.getElementById("draw-canvas"),
    context = canvasDraw.getContext("2d");
  canvasDraw.height = config.video.height;
  canvasDraw.width = config.video.width;
const redPoint = document.getElementById("redPointCanvas"),
    contextRed = redPoint.getContext("2d");
    redPoint.height = config.video.height;
    redPoint.width = config.video.width;

const redbox = document.querySelector('.redbox');
const bluebox = document.querySelector('.bluebox');

  var toggle = false;

async function main() {
  
  //context.beginPath();

  const canvas = document.querySelector("#pose-canvas");
  const ctx = canvas.getContext("2d");

  const knownGestures = [
    fp.Gestures.VictoryGesture,
    fp.Gestures.ThumbsUpGesture,
    fp.Gestures.IndexUp,
    fp.Gestures.ThumbCurl
  ];
  const GE = new fp.GestureEstimator(knownGestures);
  redbox.style.display = 'none'
  bluebox.style.display = 'none'

  // load handpose model
  const model = await handpose.load();
  console.log("Handpose model loaded");

  load.style.display="none";
  function clear(cds, width, height) {
    cds.beginPath();
    cds.clearRect(0, 0, width, height);
    cds.closePath();
  }
  function stopDraw(cds){
    cds.beginPath()
    cds.closePath();
  }

  // main estimation loop
  const estimateHands = async () => {

    // clear canvas overlay
    ctx.clearRect(0, 0, config.video.width, config.video.height);
    contextRed.clearRect(0, 0, config.video.width, config.video.height);
    

    

    // get hand landmarks from video
    // Note: Handpose currently only detects one hand at a time 
    // Therefore the maximum number of predictions is 1
    const predictions = await model.estimateHands(video, true);


    
    for (let i = 0; i < predictions.length; i++) {


      // now estimate gestures based on landmarks
      // using a minimum confidence of 7.5 (out of 10)
      function resul() {
        const est = GE.estimate(predictions[i].landmarks, 7.5);

        if (est.gestures.length > 0) {

          // find gesture with highest confidence
          let result = est.gestures.reduce((p, c) => {
            return (p.confidence > c.confidence) ? p : c;
          });

          function addEvent() {
            if (result.name == "thumbs_up") {
              res.innerHTML = "CLEAR";
            } else if (result.name == "victory") {
              res.innerHTML = "SOME ACTION";
            } else if (result.name == "indexUp") {
              let w = Math.round(predictions[i].annotations.indexFinger[3][0]);
              let h = Math.round(predictions[i].annotations.indexFinger[3][1]);
              res.innerHTML = `x: ${w} y: ${h}`;
            } else if (result.name == "thumbCurl"){
              res.innerHTML = "It's 'MoveGest'";
            }
          }
          addEvent();
     
          return result.name
        }
      } 
    
      //resul();
      const dot =  resul();
      var moveWidth;
      var moveHeight;
      
      moveWidth =  predictions[i].annotations.indexFinger[3][0] - tempWidth;
      moveHeight = predictions[i].annotations.indexFinger[3][1] - tempHeight;
      tempWidth = predictions[i].annotations.indexFinger[3][0];
      tempHeight = predictions[i].annotations.indexFinger[3][1];
    

      
      if (dot=="thumbs_up"){
        clear(context, config.video.width, config.video.height);
      } 
     
      index++;
      if (dot =='thumbCurl' && index >= 30){
        if(toggle == false){
          toggle = true;
          index=0;
        } else {
          toggle = false;
          index=0;        
        }
      }
      if (moveWidth > 30 || moveHeight > 30 || moveWidth < -30 || moveHeight < -30){
        pointLeft +=0;
        pointTop +=0;
      } else {
        pointLeft += moveWidth*2;
        pointTop += moveHeight*2;
      }
      if (toggle == true){
        if(pointLeft<0){
          pointLeft=0;
          drawSmth(context, 0, pointTop );
          drawPoint(contextRed, 0, pointTop, 5, 'red');
          context.moveTo(0, pointTop);
        } else if(pointLeft > canvasDraw.width){
          pointLeft=canvasDraw.width;
          drawSmth(context, canvasDraw.width, pointTop );
          drawPoint(contextRed, canvasDraw.width, pointTop, 5, 'red');
          context.moveTo(canvasDraw.width, pointTop);
        } else if(pointTop<0){
          pointTop=0;
          drawSmth(context, pointLeft, 0 );
          drawPoint(contextRed, pointLeft, 0, 5, 'green');
          context.moveTo(pointLeft, 0);
        } else if(pointTop>canvasDraw.height){
          pointTop=canvasDraw.height;
          drawSmth(context, pointLeft, canvasDraw.height );
          drawPoint(contextRed, pointLeft, canvasDraw.height, 5, 'green');
          context.moveTo(pointLeft, canvasDraw.height);
        } else if (pointLeft<0 && pointTop<0) {
          drawSmth(context, 0, 0 );
          pointLeft=0;
          pointTop=0;
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else if (pointLeft > canvasDraw.width && pointTop > canvasDraw.height ) {
          pointTop=canvasDraw.height;
          pointLeft=canvasDraw.width;
          drawSmth(context, 0, 0 );
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else {
          drawSmth(context, pointLeft, pointTop );
          drawPoint(contextRed, pointLeft, pointTop, 5, 'red');
          context.moveTo(pointLeft, pointTop);
        }
        console.log(pointLeft, pointTop)
        for (let part in predictions[i].annotations) {
          for (let point of predictions[i].annotations[part]) {
            drawPoint(ctx, point[0], point[1], 10, landmarkColors[part]);
          }
        }
      } else{
        if(pointLeft<0){
          pointLeft=0;
          stopDraw(context);
          drawPoint(contextRed, 0, pointTop, 5, 'red');
          context.moveTo(0, pointTop);
        } else if(pointLeft > canvasDraw.width){
          pointLeft=canvasDraw.width;
          stopDraw(context);
          drawPoint(contextRed, canvasDraw.width, pointTop, 5, 'red');
          context.moveTo(canvasDraw.width, pointTop);
        } else if(pointTop<0){
          pointTop=0;
          stopDraw(context);
          drawPoint(contextRed, pointLeft, 0, 5, 'green');
          context.moveTo(pointLeft, 0);
        } else if(pointTop>canvasDraw.height){
          pointTop=canvasDraw.height;
          stopDraw(context);
          drawPoint(contextRed, pointLeft, canvasDraw.height, 5, 'green');
          context.moveTo(pointLeft, canvasDraw.height);
        } else if (pointLeft<0 && pointTop<0) {
          stopDraw(context);
          pointLeft=0;
          pointTop=0;
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else if (pointLeft > canvasDraw.width && pointTop > canvasDraw.height ) {
          pointTop=canvasDraw.height;
          pointLeft=canvasDraw.width;
          stopDraw(context);
          drawPoint(contextRed, 0, 0, 5, 'green');
          context.moveTo(0, 0);
        } else {
          stopDraw(context);
          drawPoint(contextRed, pointLeft, pointTop, 5, 'red');
          context.moveTo(pointLeft, pointTop);
        }
        for (let part in predictions[i].annotations) {
          for (let point of predictions[i].annotations[part]) {
            drawPoint(ctx, point[0], point[1], 10, 'red');
          }
        }
      }
   
      // draw colored dots at each predicted joint position 
    }
    drawPoint(contextRed,  pointLeft, pointTop, 5, 'red')
    // ...and so on
    setTimeout(() => {
      estimateHands();
    }, 1000 / config.video.fps);
    
  };

  estimateHands();


  console.log("Starting predictions");

}

async function initCamera(width, height, fps) {

  const constraints = {
    audio: false,
    video: {
      facingMode: "user",
      width: width,
      height: height,
      frameRate: {
        max: fps
      }
    }
  };

  const video = document.querySelector("#pose-video");
  video.width = width;
  video.height = height;

  // get video stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video)
    };
  });
}

function drawSmth(cont, x, y) {
  cont.lineTo(x, y);
  cont.stroke();
}


function drawPoint(ctx, x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}


window.addEventListener("DOMContentLoaded", () => {
  initCamera(
    config.video.width, config.video.height, config.video.fps
  ).then(video => {
    video.addEventListener("loadeddata", event => {
      console.log("Camera is ready");
      main();
    });
  });



});


