import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  HalfFloatType,
  LinearFilter,
  NearestFilter,
  RGBAFormat,
  RepeatWrapping,
  Vector2,
  WebGLRenderer,
} from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

const animProgressCompute = /*glsl*/ `
  #include <common>
  uniform sampler2D instructionsTexture;

  uniform sampler2D spritesheetData;
  uniform vec2 dataSize;
  uniform float fps;
  uniform float deltaTime;

  // read spritesheet metadata
  vec4 readData(float col, float row, sampler2D tex) {
    float wStep = 1.f / dataSize.x;
    float wHalfStep = wStep * 0.5f;
    float hStep = 1.f / dataSize.y;
    float hHalfStep = 1.f / dataSize.y * 0.5f;
    return texture2D(spritesheetData, vec2(col * wStep + wHalfStep, row * hStep + hHalfStep));
  }



  void main()	{

    // OUTPUT FROM THIS SHADER
    // progressValue.r - picked animation frame
    // progressValue.g - previous progress state (for pause, reverse & pingpong consistency)
    // progressValue.b - not used yet
    // progressValue.a - previous animationID

    vec2 cellSize = 1.0 / resolution.xy;
    vec2 uv = gl_FragCoord.xy * cellSize;


    vec4 progressValue = texture2D( progress, uv );

    vec4 instructions = texture2D( instructionsTexture, uv);

    // FREEZE FRAME - return to save calculations?
    if(instructions.a >=10.){
      progressValue.r = instructions.a - 10.;
      progressValue.a = instructions.x;
      progressValue.g = progressValue.g;
      gl_FragColor = progressValue;
      return;
    }


    progressValue.b = 0.;

    // todo shouldn't be rounding here, pick
    float animationId = round(instructions.x);

    float offset = instructions.g;

    float animLength = readData(animationId, 1.f, spritesheetData).r;
    float totalTime = animLength / fps;

    // new delta is % of animation
    float newProgress = deltaTime / totalTime;
    // add new delta to saved progress
    float frameTimedId = mod(progressValue.g + newProgress, 1.);
    // frameTimedId = 0.;
    // float frameTimedId = progressValue.g;
    // save for use in next frame



    float playMode = mod(instructions.b, 10.);

    // forward
    if(playMode == 0.){
      frameTimedId = progressValue.g + newProgress;
    }
    // reverse
    if(playMode == 1.){
      frameTimedId = progressValue.g - newProgress;
    }
    // 2 - pause - do nothing
    if(playMode == 2.){
      frameTimedId = progressValue.g;
    }

    // //todo pingpong
    // if(playMode == 3.){
    // }

    // loop (play once over 10.)
    if(instructions.b < 10.){
      frameTimedId = mod(frameTimedId, 1.);
    }

    // todo This could be optional and user would reset manually,
    // todo allowing for consistent movement across multiple animations
    // todo for example - running steps being syncec
    // start anim from beginning if animationID changes
    if(progressValue.a != instructions.x){
      frameTimedId = 0.;
    }

    float frameId = floor(animLength * frameTimedId);
    float spritesheetFrameId = readData(frameId, 2.f + animationId, spritesheetData).r;



    // Picked sprite frame that goes to material
    progressValue.r = spritesheetFrameId;

    progressValue.a = instructions.x;
    progressValue.g = frameTimedId;

    gl_FragColor = progressValue;
  }
`;

const makeDataTexture = (size = 512) => {
  const combinedDataF32 = new Float32Array(size ** 2 * 4);

  for (let i = 0; i < size ** 2 * 4; i++) {
    combinedDataF32[i] = 0;
  }

  const dataTexture = new DataTexture(
    combinedDataF32,
    size,
    size,
    RGBAFormat,
    FloatType
  );

  // dataTexture.type = FloatType;
  dataTexture.minFilter = NearestFilter;
  dataTexture.magFilter = NearestFilter;
  dataTexture.wrapS = ClampToEdgeWrapping;
  dataTexture.wrapT = RepeatWrapping;
  dataTexture.needsUpdate = true;


  return dataTexture;
};

const findFirstPow2LargerThan = (x: number) => {
  if (x <= 0) {
    return 1;
  }
  let pow2 = 1;
  while (pow2 < x) {
    pow2 <<= 1;
  }
  return pow2;
};

export const initAnimationRunner = (
  renderer: WebGLRenderer,
  instanceCount: number
) => {
  // 8      =       64
  // 16     =      256
  // 32     =     1024
  // 64     =     4096
  // 128    =    16384
  // 256    =    65536
  // 512    =   262144
  // 1024   =  1048576
  // todo is there any reason anyone would run more than 1mil sprites with this??

  const computeTextureSize = findFirstPow2LargerThan(Math.sqrt(instanceCount));

  const gpuCompute = new GPUComputationRenderer(
    computeTextureSize,
    computeTextureSize,
    renderer
  );

  const progress = gpuCompute.createTexture();
  const progressVariable = gpuCompute.addVariable(
    "progress",
    animProgressCompute,
    progress
  );

  const progressDataTexture = makeDataTexture(computeTextureSize);

  progressVariable.material.uniforms["instructionsTexture"] = {
    value: progressDataTexture,
  };
  progressVariable.material.uniforms["spritesheetData"] = { value: null };
  progressVariable.material.uniforms["fps"] = { value: 0 };
  progressVariable.material.uniforms["deltaTime"] = { value: 0 };
  progressVariable.material.uniforms["dataSize"] = { value: new Vector2() };

  gpuCompute.setVariableDependencies(progressVariable, [progressVariable]);

  const error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }

  // Format of instructions coming from library user
  // R - animationId
  // G - offset
  // B - 0 - forward 1 - reverse 2 - pause 3 - pingpong | loop if over 10
  // A? - -1 - restart, 0 - nothing, 10> manually picked ID of a frame (id - 10)

  let needsUpdate = false;
  let needsClearFrameSet = false;

  const updateAnimationAt = (instanceId: number, animationId: number) => {
    const index = instanceId * 4;
    progressDataTexture.image.data[index] = animationId;
    needsUpdate = true;
  };

  const updateOffsetAt = (instanceId: number, offset: number) => {
    const index = instanceId * 4;
    progressDataTexture.image.data[index + 1] = offset;
    needsUpdate = true;
  };

  const updatePlaymodeAt = (instanceId: number, playmode: number) => {
    const index = instanceId * 4;
    progressDataTexture.image.data[index + 2] = playmode;
    needsUpdate = true;
  };

  const updateFrameAt = (instanceId: number, frameId: number) => {
    const index = instanceId * 4;
    progressDataTexture.image.data[index + 3] = frameId + 10;
    needsUpdate = true;
  };

  const update = () => {
    if (needsUpdate) {
      progressDataTexture.needsUpdate = true;
      needsUpdate = false;
    }
    gpuCompute.compute();
  };

  // todo make this nicer after deciding on api
  return {
    gpuCompute,
    animationRunner: progressVariable,
    progressDataTexture,
    utils: {
      updateAnimationAt,
      updateOffsetAt,
      updatePlaymodeAt,
      updateFrameAt,
    },
    update,
  };
};
