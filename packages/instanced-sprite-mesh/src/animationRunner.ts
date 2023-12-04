import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  LinearFilter,
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
  uniform float time;

  // read spritesheet metadata
  vec4 readData(float col, float row, sampler2D tex) {
    float wStep = 1.f / dataSize.x;
    float wHalfStep = wStep * 0.5f;
    float hStep = 1.f / dataSize.y;
    float hHalfStep = 1.f / dataSize.y * 0.5f;
    return texture2D(spritesheetData, vec2(col * wStep + wHalfStep, row * hStep + hHalfStep));
  }

  void main()	{    

    vec2 cellSize = 1.0 / resolution.xy;
    vec2 uv = gl_FragCoord.xy * cellSize;

    // progressValue.x - picked animation frame
    // progressValue.y - previous progress state (for pause, reverse & pingpong consistency)
    // progressValue.z - not used yet
    // progressValue.w - not used yet
    vec4 progressValue = texture2D( progress, uv );


    vec4 instructions = texture2D( instructionsTexture, uv);


    progressValue.z = 0.;
    progressValue.w = 1.;
    
    // todo shouldn't be rounding here, pick
    float animationId = round(instructions.x);
    
    float offset = instructions.g;

    float animLength = readData(animationId, 1.f, spritesheetData).r;
    float totalTime = animLength / fps;
    float frameTimedId = mod(time + offset, totalTime) / totalTime;

    float frameId = floor(animLength * frameTimedId);
    float spritesheetFrameId = readData(frameId, 2.f + animationId, spritesheetData).r;
    
    // Picked sprite frame that goes to material
    progressValue.x = spritesheetFrameId;
    // Save current time
    progressValue.y = frameTimedId;

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

  dataTexture.type = FloatType;
  dataTexture.minFilter = LinearFilter;
  dataTexture.magFilter = LinearFilter;
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

  console.log({ computeTextureSize });

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
  progressVariable.material.uniforms["time"] = { value: 0 };
  progressVariable.material.uniforms["dataSize"] = { value: new Vector2() };

  gpuCompute.setVariableDependencies(progressVariable, [progressVariable]);

  const error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }

  // Format of instructions coming from library user
  // R - animationId
  // G - offset?
  // B - 0 - forward 1 - reverse 2 - pingpong | loop if over 10
  // A -

  const updateAnimationAt = (instanceId: number, animationId: number) => {
    const index = instanceId * 4;
    progressDataTexture.image.data[index] = animationId;
    progressDataTexture.needsUpdate = true;
  };

  // todo make this nicer after deciding on api
  return {
    gpuCompute,
    variables: { progressVariable },
    progressDataTexture,
    updateAnimationAt,
  };
};
