  
  const video = document.querySelector("#pose-video");
  const widthVideo = video.clientWidth;
  const heightVideo = video.clientHeight;
  const config = {
    video: { width: window.screen.width, height: window.screen.height, fps: 60 }
  };


  const res = document.querySelector(".result");
  const landmarkColors = {
    thumb: 'red',
    indexFinger: 'blue',
    middleFinger: 'yellow',
    ringFinger: 'green',
    pinky: 'pink',
    palmBase: 'white'
    
  };

  const redbox = document.querySelector('.redbox'); 
  const bluebox = document.querySelector('.bluebox'); 
  function Box (boxOn, boxOff){
    boxOn.style.display = 'block'; 
    boxOff.style.display = 'none'; 
    clearTimeout(off);
    var off = setTimeout(()=>{boxOn.style.display = 'none'; res.innerHTML='';}, 2000)
    
  };


  async function main() {

    
    const canvas = document.querySelector("#pose-canvas");
    const ctx = canvas.getContext("2d");

    const knownGestures = [
      fp.Gestures.VictoryGesture,
      fp.Gestures.ThumbsUpGesture,
      fp.Gestures.IndexUp
    ];
    const GE = new fp.GestureEstimator(knownGestures);
    redbox.style.display = 'none'
    bluebox.style.display = 'none'

    // load handpose model
    const model = await handpose.load();
    console.log("Handpose model loaded");

    // main estimation loop
    const estimateHands = async () => {

      // clear canvas overlay
      ctx.clearRect(0, 0, config.video.width, config.video.height);
    

      // get hand landmarks from video
      // Note: Handpose currently only detects one hand at a time
      // Therefore the maximum number of predictions is 1
      const predictions = await model.estimateHands(video, true);

      for(let i = 0; i < predictions.length; i++) {

        
        // now estimate gestures based on landmarks
        // using a minimum confidence of 7.5 (out of 10)
        function resul(){
        const est = GE.estimate(predictions[i].landmarks, 7.5);
        
        if(est.gestures.length > 0) {

          // find gesture with highest confidence
          let result = est.gestures.reduce((p, c) => { 
            return (p.confidence > c.confidence) ? p : c;
          });
          
          function addEvent() { 
            if (result.name == "thumbs_up"){
              Box(redbox, bluebox);
              res.innerHTML = "<= It's 'Like'";
            } else if (result.name == "victory"){
              Box(bluebox, redbox);
              res.innerHTML = "It's 'Peace' =>";
            } else if (result.name == "indexUp"){
              let w = Math.round(predictions[i].annotations.indexFinger[3][0]);
              let h = Math.round(predictions[i].annotations.indexFinger[3][1]);

              res.innerHTML = `x: ${w} y: ${h}`;
            }        
          }
          addEvent();
          return result.name;
        }
      }
      resul();
      const dot = resul();
      // draw colored dots at each predicted joint position
        
      if(dot !== 'indexUp'){
        for(let part in predictions[i].annotations) {
          for(let point of predictions[i].annotations[part]) {
            drawPoint(ctx, point[0], point[1], 10, landmarkColors[part]);
          }
        }
      } else {
        drawPoint(ctx, predictions[i].annotations.indexFinger[3][0], predictions[i].annotations.indexFinger[3][1], 10, 'blue');
      }
    }
      // ...and so on
      setTimeout(() => { estimateHands(); }, 1000 / config.video.fps);
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
        frameRate: { max: fps }
      }
    };

    const video = document.querySelector("#pose-video");
    video.width = width;
    video.height = height;

    // get video stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    console.log(stream);

    return new Promise(resolve => {
      video.onloadedmetadata = () => { resolve(video) };
    });
  }

  function drawPoint(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  window.addEventListener("DOMContentLoaded", () => {
    initCamera(
      config.video.width, config.video.height, config.video.fps
    ).then(video => {
      video.play();
      video.addEventListener("loadeddata", event => {
        console.log("Camera is ready");
        main();
      });
    });

    const canvas = document.querySelector("#pose-canvas");
    canvas.width = config.video.width;
    canvas.height = config.video.height;
    console.log("Canvas initialized");

    const fall = document.querySelector(".fall");
    fall.innerHTML = `w: ${canvas.width} h: ${canvas.height}`

  });
