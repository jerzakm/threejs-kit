import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  LinearFilter,
  RGBAFormat,
  RepeatWrapping,
  WebGLRenderer,
} from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

const animProgressCompute = /*glsl*/ `
  #include <common>
  uniform sampler2D instructionsTexture;

  void main()	{

    vec2 cellSize = 1.0 / resolution.xy;

    vec2 uv = gl_FragCoord.xy * cellSize;

    // progressValue.x == val from previous frame
    // progressValue.y == val from penultimate frame
    // progressValue.z, progressValue.w not used
    vec4 progressValue = texture2D( progress, uv );

    vec4 instructions = texture2D(instructionsTexture, uv);


    progressValue.z = 0.;
    progressValue.w = 1.;


    progressValue.y = instructions.x;    
    progressValue.x = mod(progressValue.x +0.01, 1.);

    gl_FragColor = progressValue;

  }
`;

const makeDataTexture = (size = 512) => {
  // R -
  // G -
  // B -
  // A -

  const combinedDataF32 = new Float32Array(size ** 2 * 4);

  for (let i = 0; i < size ** 2 * 4; i++) {
    combinedDataF32[i] = Math.random();
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

  gpuCompute.setVariableDependencies(progressVariable, [progressVariable]);

  const error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }

  return { gpuCompute, variables: { progressVariable }, progressDataTexture };
};
