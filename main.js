import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165/build/three.module.js';

const canvas = document.getElementById('webgl');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

camera.position.z = 60;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias:true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const particleCount = 10000;

const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(particleCount * 3);

const originalPositions = [];

for(let i=0;i<particleCount;i++){

  const i3 = i * 3;

  const radius = 20 * Math.random();
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i3] = x;
  positions[i3+1] = y;
  positions[i3+2] = z;

  originalPositions.push(x,y,z);
}

geometry.setAttribute(
  'position',
  new THREE.BufferAttribute(positions,3)
);

const material = new THREE.PointsMaterial({
  color:'#00ffff',
  size:0.15,
  transparent:true,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});

const particles = new THREE.Points(geometry,material);

scene.add(particles);

const colorPicker = document.getElementById('colorPicker');
const patternSelect = document.getElementById('patternSelect');

colorPicker.addEventListener('input',(e)=>{
  material.color.set(e.target.value);
});

document.getElementById('fullscreenBtn')
.addEventListener('click',()=>{

  if(!document.fullscreenElement){
    document.body.requestFullscreen();
  }else{
    document.exitFullscreen();
  }
});

const videoElement = document.getElementById('inputVideo');

let handOpen = 0;

function calculateHandOpen(landmarks){

  const thumb = landmarks[4];
  const index = landmarks[8];

  const dx = thumb.x - index.x;
  const dy = thumb.y - index.y;

  return Math.sqrt(dx*dx + dy*dy);
}

const hands = new Hands({
  locateFile: (file)=>{
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});

hands.setOptions({
  maxNumHands:1,
  modelComplexity:1,
  minDetectionConfidence:0.7,
  minTrackingConfidence:0.7
});

hands.onResults((results)=>{

  if(results.multiHandLandmarks.length > 0){

    const landmarks = results.multiHandLandmarks[0];

    handOpen = calculateHandOpen(landmarks);

  }
});

const cameraFeed = new Camera(videoElement,{
  onFrame: async ()=>{
    await hands.send({image: videoElement});
  },
  width:640,
  height:480
});

cameraFeed.start();

function generatePattern(type){

  const pos = geometry.attributes.position.array;

  for(let i=0;i<particleCount;i++){

    const i3 = i * 3;

    if(type === 'sphere'){

      const radius = 20 * Math.random();
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      pos[i3] =
        radius * Math.sin(phi) * Math.cos(theta);

      pos[i3+1] =
        radius * Math.sin(phi) * Math.sin(theta);

      pos[i3+2] =
        radius * Math.cos(phi);

    }

    if(type === 'wave'){

      const x = (Math.random()-0.5) * 50;
      const z = (Math.random()-0.5) * 50;

      pos[i3] = x;
      pos[i3+1] = Math.sin(x * 0.2) * 5;
      pos[i3+2] = z;
    }

    if(type === 'galaxy'){

      const angle = Math.random() * Math.PI * 8;
      const radius = Math.random() * 25;

      pos[i3] = Math.cos(angle) * radius;
      pos[i3+1] = (Math.random()-0.5) * 10;
      pos[i3+2] = Math.sin(angle) * radius;
    }
  }

  geometry.attributes.position.needsUpdate = true;
}

patternSelect.addEventListener('change',(e)=>{
  generatePattern(e.target.value);
});

const clock = new THREE.Clock();

function animate(){

  requestAnimationFrame(animate);

  const pos = geometry.attributes.position.array;

  const scaleFactor = THREE.MathUtils.lerp(
    0.5,
    2.5,
    handOpen * 5
  );

  for(let i=0;i<particleCount;i++){

    const i3 = i * 3;

    pos[i3] +=
      (originalPositions[i3] * scaleFactor - pos[i3]) * 0.02;

    pos[i3+1] +=
      (originalPositions[i3+1] * scaleFactor - pos[i3+1]) * 0.02;

    pos[i3+2] +=
      (originalPositions[i3+2] * scaleFactor - pos[i3+2]) * 0.02;
  }

  geometry.attributes.position.needsUpdate = true;

  particles.rotation.y += 0.002;

  renderer.render(scene,camera);
}

animate();

window.addEventListener('resize',()=>{

  camera.aspect =
    window.innerWidth/window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});
