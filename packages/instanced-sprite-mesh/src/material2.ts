import { ShaderChunk, Vector2, Vector4 } from 'three'

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

export const patchSpriteMaterial = (material: any, triGeometry = false) => {
  let amount = performance.now() * 100

  material.defines = { USE_UV: '' }

  if (triGeometry) {
    material.defines['TRI_GEOMETRY'] = ''
  }

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
      tint: { value: new Vector4(0, 0, 0, 0) }
    }

    shader.vertexShader = shader.vertexShader.replace(
      '#include <batching_pars_vertex>',
      /*glsl*/ `
			#include <batching_pars_vertex>

			flat varying uint vInstanceIndex;
			`
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <batching_vertex>',
      /*glsl*/ `
			#include <batching_vertex>
			vInstanceIndex = instanceIndex;
			`
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      /*glsl*/ `
			#include <common>
			uniform sampler2D animationData;
			uniform uint animationDataSize;
			uniform sampler2D spritesheetData;
			uniform float flipX;
			uniform float flipY;
			uniform vec2 dataSize;
			uniform vec4 tint;
			uniform float testValue;

			flat varying uint vInstanceIndex;

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
				float y = float(vInstanceIndex / animationDataSize) / float(animationDataSize);
				float x = mod(float(vInstanceIndex), float(animationDataSize)) / float(animationDataSize);

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
    material.userData.shader = shader
  }

  material.customProgramCacheKey = function () {
    return amount.toFixed(1)
  }

  return material
}
