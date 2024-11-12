import { createTexture_vec2 } from '@three.ez/instanced-mesh'
import {
  ShaderChunk,
  ShaderMaterial,
  ShaderMaterialParameters,
  Texture,
  Vector2,
  Vector4
} from 'three'

export class SpriteMaterial2 extends ShaderMaterial {
  public override vertexShader = /*glsl*/ `
    #include <get_from_texture>
    #include <instanced_pars_vertex>

    varying vec2 vUv;
    flat varying uint vInstanceIndex;
		flat varying int vId;

    void main() {

      #include <instanced_vertex>

      vUv = uv;
      vInstanceIndex = instanceIndex;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
			vId = gl_InstanceID;
    }`

  public override fragmentShader = /*glsl*/ `
    #include <get_from_texture>

	  uniform highp sampler2D offsetTexture;
    uniform sampler2D map;
    uniform vec2 tileSize;

		uniform sampler2D animationData;
		uniform int animationDataSize;
		uniform sampler2D spritesheetData;
		uniform float startTime;
		uniform float time;
		uniform float flipX;
		uniform float flipY;
		uniform vec2 dataSize;
		uniform vec4 tint;
		uniform float testValue;

    varying vec2 vUv;
    flat varying uint vInstanceIndex;
		flat varying int vId;

		vec4 readData(float col, float row) {
			float wStep = 1.f / dataSize.x;
			float wHalfStep = wStep * 0.5f;
			float hStep = 1.f / dataSize.y;
			float hHalfStep = 1.f / dataSize.y * 0.5f;
			return texture2D(spritesheetData, vec2(col * wStep + wHalfStep, row * hStep + hHalfStep));
		}

		vec2 zoomUV(vec2 uv, vec2 zoomCenter, float zoomFactor) {
			vec2 shiftedUV = uv - zoomCenter;
			shiftedUV *= zoomFactor;
			shiftedUV += zoomCenter;
			return shiftedUV;
		}

    void main() {
			float y = float(vId / animationDataSize) / float(animationDataSize);
      float x = mod(float(vId),float(animationDataSize)) / float(animationDataSize);

      float spritesheetFrameId = texture2D(animationData, vec2(x,y)).r;

			vec4 frameMeta = readData(spritesheetFrameId, 0.f);

			vec2 fSize = frameMeta.zw;
			vec2 fOffset = vec2(frameMeta.xy);

      vec2 transformedPlaneUv = vUv + vec2(0.,0.);

			// todo  == 1. caused a flickering bug. look into Precision/interpolation?
      if(flipX > 0.){
        transformedPlaneUv.x = 1. - transformedPlaneUv.x;
      }
      if(flipY > 0.){
        transformedPlaneUv.y = 1. - transformedPlaneUv.y;
      }

			vec2 spriteUv = fSize * transformedPlaneUv + fOffset;
			vec4 spriteColor = texture2D( map, spriteUv );

      gl_FragColor = spriteColor;
    }`

  constructor(count: number, parameters?: ShaderMaterialParameters & { map: Texture }) {
    super(parameters)

    this.uniforms = {
      /** GPGPU animation driven data */
      animationData: { value: null },
      animationDataSize: { value: 0 },
      /* Repeat animation in a loop */
      billboarding: { value: 0 },
      /** flip uvs on x */
      flipX: { value: 0 },
      /** flip uvs on y */
      flipY: { value: 0 },
      /**
       * DataArrayTexture - data stored in columns. Rows are:
       * 0 - Frames declaration - RGBA[x,y,w,h]
       * 1 - Animation lengths RGBA[length,0,0,0]
       * 2 - Animation0 - RGBA [id,duration, 0,0]
       * 3 - Animation1 - RGBA [id,duration, 0,0]
       * ....etc
       */
      spritesheetData: { value: null },
      /**util for reading data texture in spritesheetData */
      dataSize: { value: new Vector2(0, 0) },
      /**
       * Tinting - Vector4 (enabled 0/1, H (0-3), S (0-1), V(0-1))
       */
      tint: { value: new Vector4(0, 0, 0, 0) }
    }

    this.uniforms.offsetTexture = { value: createTexture_vec2(count) }
    if (parameters?.map) {
      this.uniforms.map = { value: parameters.map }
    }
  }
}

const replaceUVs = (text: string, replacement: string) => {
  const lines = text.split('\n')
  const matUVs = /vMapUv|vAlphaMapUv|vNormalMapUv/g

  const modifiedLines = lines.map((line) => {
    if (!line.includes('varying') && !line.includes('uniform')) {
      return line.replace(matUVs, replacement)
    }
    return line
  })

  return modifiedLines.join('\n')
}

const expandThreejsMaterialChunks = (shader: string) => {
  return shader.replace(/#include <([^>]+)>/g, (match, chunkName: keyof typeof ShaderChunk) => {
    return ShaderChunk[chunkName] || ''
  })
}

export const patchSpriteMaterial = (material: any) => {
  let amount = performance.now() * 100

  material.defines = { USE_UV: '' }

  material.onBeforeCompile = function (shader: any) {
    shader.uniforms = {
      ...shader.uniforms /** GPGPU animation driven data */,
      animationData: { value: null },
      animationDataSize: { value: 0 },
      /* Repeat animation in a loop */
      billboarding: { value: 0 },
      /** flip uvs on x */
      flipX: { value: 0 },
      /** flip uvs on y */
      flipY: { value: 0 },
      /**
       * DataArrayTexture - data stored in columns. Rows are:
       * 0 - Frames declaration - RGBA[x,y,w,h]
       * 1 - Animation lengths RGBA[length,0,0,0]
       * 2 - Animation0 - RGBA [id,duration, 0,0]
       * 3 - Animation1 - RGBA [id,duration, 0,0]
       * ....etc
       */
      spritesheetData: { value: null },
      /**util for reading data texture in spritesheetData */
      dataSize: { value: new Vector2(0, 0) },
      /**
       * Tinting - Vector4 (enabled 0/1, H (0-3), S (0-1), V(0-1))
       */
      tint: { value: new Vector4(0, 0, 0, 0) },
      time: { value: 0 }
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <batching_pars_vertex>',
      /*glsl*/ `
			#include <batching_pars_vertex>
			flat varying uint vInstanceIndex;
			flat varying int vId;
			`
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <batching_vertex>',
      /*glsl*/ `
			#include <batching_vertex>
			vInstanceIndex = instanceIndex;
			vId = gl_InstanceID;
			`
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /*glsl*/ `
			#include <common>
			uniform sampler2D animationData;
			uniform int animationDataSize;
			uniform sampler2D spritesheetData;
			uniform float startTime;
			uniform float time;
			uniform float flipX;
			uniform float flipY;
			uniform vec2 dataSize;
			uniform vec4 tint;
			uniform float testValue;

			flat varying uint vInstanceIndex;
			flat varying int vId;

			vec4 readData(float col, float row) {
				float wStep = 1.f / dataSize.x;
				float wHalfStep = wStep * 0.5f;
				float hStep = 1.f / dataSize.y;
				float hHalfStep = 1.f / dataSize.y * 0.5f;
				return texture2D(spritesheetData, vec2(col * wStep + wHalfStep, row * hStep + hHalfStep));
			}

			vec2 zoomUV(vec2 uv, vec2 zoomCenter, float zoomFactor) {
				vec2 shiftedUV = uv - zoomCenter;
				shiftedUV *= zoomFactor;
				shiftedUV += zoomCenter;
				return shiftedUV;
			}
			`
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      /*glsl*/ `void main() {
				float y = float(vId / animationDataSize) / float(animationDataSize);
				float x = mod(float(vId),float(animationDataSize)) / float(animationDataSize);

				float spritesheetFrameId = texture2D(animationData, vec2(x,y)).r;

				vec4 frameMeta = readData(spritesheetFrameId, 0.f);

				vec2 fSize = frameMeta.zw;
				vec2 fOffset = vec2(frameMeta.xy);

				vec2 transformedPlaneUv = vUv + vec2(0.,0.);
				// todo  == 1. caused a flickering bug. look into Precision/interpolation?
				if(flipX > 0.){
					transformedPlaneUv.x = 1. - transformedPlaneUv.x;
				}
				if(flipY > 0.){
					transformedPlaneUv.y = 1. - transformedPlaneUv.y;
				}
				vec2 spriteUv = fSize * transformedPlaneUv + fOffset ;
				`
    )

    shader.fragmentShader = expandThreejsMaterialChunks(shader.fragmentShader)

    shader.fragmentShader = replaceUVs(shader.fragmentShader, 'spriteUv')

    // shader.fragmentShader =
    //   shader.fragmentShader.slice(0, -1) +
    //   /*glsl*/ `gl_FragColor = vec4(spriteUv * sin(time*0.01), 1.,1.);` +
    //   shader.fragmentShader.slice(-1)

    material.userData.shader = shader
  }

  // Make sure WebGLRenderer doesnt reuse a single program

  material.customProgramCacheKey = function () {
    return amount.toFixed(1)
  }

  return material
}
