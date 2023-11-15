import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  LinearFilter,
  Material,
  RGBAFormat,
  RepeatWrapping,
  Vector2,
} from "three";

//@ts-ignore
import { createDerivedMaterial } from "troika-three-utils";

/** replace base UVs with the altered spritesheet UV.
 * Should allow for supporting of most THREE base materials
 * TODO needs improvements
 */
const replaceUVs = (text: string, replacement: string) => {
  const lines = text.split("\n");
  const matUVs = /vMapUv|vAlphaMapUv|vNormalMapUv/g;

  const modifiedLines = lines.map((line) => {
    if (!line.includes("varying") && !line.includes("uniform")) {
      return line.replace(matUVs, replacement);
    }
    return line;
  });

  return modifiedLines.join("\n");
};

// TODO TYPE GENERICS
export const constructSpriteMaterial = (baseMaterial: Material): Material => {
  const customMaterial = createDerivedMaterial(baseMaterial, {
    defines: {
      USE_UV: "",
    },
    uniforms: {
      /** active animation */
      animationId: { value: 0 },
      /** timer in s */
      time: { value: 0 },
      /** per instance time offset, can be used so that all of the animations aren't perfectly synced */
      offset: { value: 0 },
      /**
       * How many different animations there are.
       * Needed to determine number of rows there are in DataTexture
       */
      fps: { value: 0 },
      dataSize: { value: new Vector2(0, 0) },
      /**
       * DataArrayTexture - data stored in columns. Rows are:
       * 0 - Frames declaration - RGBA[x,y,w,h]
       * 1 - Animation lengths RGBA[length,0,0,0]
       * 2 - Animation0 - RGBA [id,duration, 0,0]
       * 3 - Animation1 - RGBA [id,duration, 0,0]
       * ....etc
       */
      spritesheetData: { value: null },
    },
    vertexMainOutro: `

			vec3 instancePosition = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

			vec3 cameraRight_worldspace = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
    	vec3 cameraUp_worldspace = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);

			vec2 BillboardSize = vec2 (1.,1.);

			vec3 vertexPosition_worldspace = instancePosition
        + cameraRight_worldspace * position.x * BillboardSize.x
        + cameraUp_worldspace * position.y * BillboardSize.y;
			//wip billboarding
			// gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition_worldspace, 1.0);


    `,
    customRewriter: ({ vertexShader, fragmentShader }: any) => {
      // uniforms etc
      const header = /*glsl*/ `
			uniform sampler2D spritesheetData;
			uniform float animationId;
			uniform float time;
			uniform float offset;
			uniform float fps;
			uniform vec2 dataSize;
			`;

      // read spritesheet metadata
      const readData = /*glsl*/ `
			vec4 readData(float col, float row) {
				float wStep = 1.f / dataSize.x;
				float wHalfStep = wStep * 0.5f;
				float hStep = 1.f / dataSize.y;
				float hHalfStep = 1.f / dataSize.y * 0.5f;
				return texture2D(spritesheetData, vec2(col * wStep + wHalfStep, row * hStep + hHalfStep));
			}
			`;

      // calculate sprite UV
      const spriteUv = /*glsl*/ `
			float animLength = readData(animationId, 1.f).r;
			float totalTime = animLength / fps;

			float frameTimedId = mod(time + offset, totalTime) / totalTime;
      // frameTimedId = time / totalTime;
			float frameId = floor(animLength * frameTimedId);

			float spritesheetFrameId = readData(frameId, 2.f + animationId).r;
			// x,y,w,h
			vec4 frameMeta = readData(spritesheetFrameId, 0.f);

			vec2 fSize = frameMeta.zw;
			vec2 fOffset = vec2(frameMeta.xy);
			vec2 spriteUv = fSize * vUv + fOffset;
			`;
      fragmentShader = fragmentShader.replace(
        `void main() {`,
        `void main() {${spriteUv}`
      );

      fragmentShader = `
			${header}
			${readData}
			${fragmentShader}
			`;

      fragmentShader = replaceUVs(fragmentShader, "spriteUv");

      // console.log(fragmentShader)
      // console.log(vertexShader)

      return { vertexShader, fragmentShader };
    },
  });
  return customMaterial;
};

export const parseAseprite = (json: any) => {
  const frames: [x: number, y: number, w: number, h: number][] = [];
  const frameDurations: number[] = [];
  const animations: Record<string, [frameId: number, duration: number][]> = {};
  const animationLengths: number[] = [];

  const w = json.meta.size.w;
  const h = json.meta.size.h;

  const sheetSize: [w: number, h: number][] = [
    json.meta.size.w,
    json.meta.size.h,
  ];

  for (const fId in json.frames) {
    const f = json.frames[fId];
    frames.push([f.frame.x / w, f.frame.y / h, f.frame.w / w, f.frame.h / h]);
    frameDurations.push(f.duration);
  }
  for (const a of json.meta.frameTags) {
    animations[a.name] = [];
    for (let i = a.from; i <= a.to; i++) {
      animations[a.name].push([i, frameDurations[i]]);
    }
    animationLengths.push(animations[a.name].length);
  }

  return { frames, animations, sheetSize, animationLengths };
};

export type SpritesheetFormat = {
  frames: [x: number, y: number, w: number, h: number][];
  animations: Record<string, [frameId: number, duration: number][]>;
  sheetSize: [w: number, h: number][];
  animationLengths: number[];
};

export const makeDataTexture = (data: SpritesheetFormat) => {
  const { frames, animationLengths, animations } = data;
  // find the longest array to determine data width uniform
  const dataWidth = Math.max(
    frames.length,
    animationLengths.length,
    ...Object.values(animations).map((a) => {
      return a.length;
    })
  );
  const dataHeight = 2 + Object.values(animations).length;

  // Flatten all rows if necessary and fill with 0 if too short (dataWidth)

  // row 0
  const framesRGBA = frames
    .flat()
    .concat(new Array((dataWidth - frames.length) * 4).fill(0));
  // row 1
  const animationLengthsRGBA = animationLengths
    .map((l) => {
      return [l, 0, 0, 0];
    })
    .flat()
    .concat(new Array((dataWidth - animationLengths.length) * 4).fill(0));

  // row 2+
  const animationsRGBA: number[] = [];
  const animMap: Map<string, number> = new Map();

  for (let i = 0; i < Object.keys(animations).length; i++) {
    const key = Object.keys(animations)[i];
    animMap.set(key, i);
    const aFrames = animations[key]
      .map((a) => {
        return [...a, 0, 0];
      })
      .flat()
      .concat(new Array((dataWidth - animations[key].length) * 4).fill(0));

    animationsRGBA.push(...aFrames);
  }

  const combinedData = [
    ...framesRGBA,
    ...animationLengthsRGBA,
    ...animationsRGBA,
  ];

  const combinedDataF32 = new Float32Array(combinedData);
  combinedDataF32.set(combinedData);

  const dataTexture = new DataTexture(
    combinedDataF32,
    dataWidth,
    dataHeight,
    RGBAFormat,
    FloatType
  );
  dataTexture.type = FloatType;
  dataTexture.minFilter = LinearFilter;
  dataTexture.magFilter = LinearFilter;
  dataTexture.wrapS = ClampToEdgeWrapping;
  dataTexture.wrapT = RepeatWrapping;
  dataTexture.needsUpdate = true;

  return { dataTexture, dataWidth, dataHeight, animMap };
};