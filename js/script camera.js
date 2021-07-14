

  const load = document.querySelector('.load');
  const video = document.querySelector("#pose-video");
  if(video== null){
    load.style.display = "none";
  } else{
    const widthVideo = video.offsetWidth;
    const heightVideo = video.offsetHeight; 
    const config = {
      video: { width: widthVideo, height: heightVideo, fps: 30 }
    };
    const res = document.querySelector(".result");


  var index = 0;
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



    async function main() {
      
      var toggle = false;
      const canvas = document.querySelector("#pose-canvas");
      const ctx = canvas.getContext("2d");


      const knownGestures = [
        fp.Gestures.VictoryGesture,
        fp.Gestures.ThumbsUpGesture,
        fp.Gestures.IndexUp,
        fp.Gestures.ThumbCurl 
      ];
      const GE = new fp.GestureEstimator(knownGestures);


      // load handpose model

      const model = await handpose.load();

      console.log("Handpose model loaded");

      load.style.display = "none";
      // main estimation loop
      const estimateHand = async () => {

        // clear canvas overlay
        ctx.clearRect(0, 0, config.video.width, config.video.height);
      

        // get hand landmarks from video
        // Note: Handpose currently only detects one hand at a time
        // Therefore the maximum number of predictions is 1
        const predictions = await model.estimateHands(video, true);

        for(let i=0; i < predictions.length; i++) {
          

          
          // now estimate gestures based on landmarks
          // using a minimum confidence of 7.5 (out of 10)
          function resul(){
          const est = GE.estimate(predictions[i].landmarks, 7.5);
          
          if(est.gestures.length > 0) {

            // find gesture with highest confidence
            let result = est.gestures.reduce((p, c) => { 
              return (p.confidence > c.confidence) ? p : c;
            });
            index++;
            function addEvent() { 
              if (result.name == "thumbs_up") {
                res.innerHTML = "CLEAR";
                toggle = true
              } else if (result.name == "victory") {
                res.innerHTML = "SOME ACTION";
              } else if (result.name == "indexUp") {
                let w = Math.round(predictions[i].annotations.indexFinger[3][0]);
                let h = Math.round(predictions[i].annotations.indexFinger[3][1]);
                res.innerHTML = `x: ${w} y: ${h}`;
              } else if (result.name == "thumbCurl") {
                
                if (result.name == 'thumbCurl' && index >= 30) {
                  if (toggle == false) {
                    toggle = true;
                  } else {
                    toggle = false;
                  }
                  res.innerHTML = "Toggle";
                  index = 0;
                }
              }
            }
            addEvent();
            return result.name;
          }
        }
        resul();
        let infoPoint = {
          x: predictions[i].annotations.indexFinger[3][0],
          y: predictions[i].annotations.indexFinger[3][1],
          name: resul()
        }
        obj.sendThis(infoPoint);
        
        
        // draw colored dotobjs at each predicted joint position
        if(toggle == true ){
          for (let part in predictions[i].annotations) {
            for (let point of predictions[i].annotations[part]) {
              drawPoint(ctx, point[0], point[1], 10, 'red');
            }
          }
        } else {
          for (let part in predictions[i].annotations) {
            for (let point of predictions[i].annotations[part]) {
              drawPoint(ctx, point[0], point[1], 10, landmarkColors[part]);
            }
          }
        } 
      }
      
    
        // ...and so on
        setTimeout(() => { estimateHand(); }, 1000 / config.video.fps);
      };

      estimateHand();
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
        video.addEventListener("loadeddata", event => {
          console.log("Camera is ready");
          main();
        });
      });
      const canvas = document.querySelector("#pose-canvas");
      
        canvas.width = config.video.width;
        canvas.height = config.video.height;

    });
}