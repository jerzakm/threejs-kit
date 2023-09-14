import {
  MeshPhysicalMaterial,
  Vector2,
  type Shader,
  MeshPhysicalMaterialParameters,
  Texture,
} from "three";

import parallaxUv from "./parallax_uv_swap.glsl?raw";

interface MeshParallaxMaterialProps {
  debugQualityMask?: boolean;
  parallaxOcclusionMap?: Texture;
  repeatUv?: Vector2;
  parallaxScale?: number;
  parallaxMinLayers?: number;
  parallaxMaxLayers?: number;
  cutoffDistance?: number;
}

export class MeshParallaxMaterial extends MeshPhysicalMaterial {
  private ParallaxOcclusionMap: { value: Texture | null } = { value: null };
  private RepeatUv = { value: new Vector2(1, 1) };
  private ParallaxScale = { value: 0.1 };
  private ParallaxMinLayers = { value: 16 };
  private ParallaxMaxLayers = { value: 128 };
  private CutoffDistance = { value: 300 };

  constructor(
    parameters: MeshPhysicalMaterialParameters = {},
    parallaxParameters: MeshParallaxMaterialProps
  ) {
    super(parameters);
    this.setValues(parameters);

    if (parallaxParameters.repeatUv)
      this.RepeatUv.value = parallaxParameters.repeatUv;

    if (parallaxParameters.parallaxScale)
      this.ParallaxScale.value = parallaxParameters.parallaxScale;

    if (parallaxParameters.parallaxMinLayers)
      this.ParallaxMinLayers.value = parallaxParameters.parallaxMinLayers;

    if (parallaxParameters.parallaxMaxLayers)
      this.ParallaxMaxLayers.value = parallaxParameters.parallaxMaxLayers;

    if (parallaxParameters.cutoffDistance)
      this.CutoffDistance.value = parallaxParameters.cutoffDistance;

    if (parallaxParameters.parallaxOcclusionMap)
      this.ParallaxOcclusionMap.value = parallaxParameters.parallaxOcclusionMap;

    if (parallaxParameters.debugQualityMask)
      this.defines["QUALITY_MASK_DEBUG"] = "";
  }
  onBeforeCompile(shader: Shader) {
    shader.uniforms.ParallaxOcclusionMap = this.ParallaxOcclusionMap;
    shader.uniforms.repeatUv = this.RepeatUv;
    shader.uniforms.parallaxScale = this.ParallaxScale;
    shader.uniforms.parallaxMinLayers = this.ParallaxMinLayers;
    shader.uniforms.parallaxMaxLayers = this.ParallaxMaxLayers;
    shader.uniforms.cutoffDistance = this.CutoffDistance;

    shader.vertexShader = shader.vertexShader.replace(
      `#include <clipping_planes_pars_vertex>`,
      /*glsl*/ `
      #include <clipping_planes_pars_vertex>
      
      varying vec2 vUv;

      varying float vDistance;
      varying float vCosTheta;

      uniform vec2 repeatUv;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      `#include <fog_vertex>`,
      /*glsl*/ `
      #include <fog_vertex>
      
      vUv = uv * repeatUv;

      vDistance = length(cameraPosition - worldPosition.xyz);
      
      vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
      vec3 wNormal = mat3(modelMatrix) * normal;

      vCosTheta = dot(normalize(wNormal), viewDir);  
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <clipping_planes_pars_fragment>`,

      /*glsl*/ `
     #include <clipping_planes_pars_fragment>

     varying vec2 vUv;

     varying float vDistance;
     varying float vCosTheta;

     uniform sampler2D ParallaxOcclusionMap;
     uniform vec2 repeatUv;    

     uniform float parallaxScale;
     uniform float parallaxMinLayers;
     uniform float parallaxMaxLayers;
     
     uniform float cutoffDistance;

     uniform mat4 projectionMatrix;
     

     vec2 parallaxMap(in vec3 V, float parallaxScale, float oParallaxMinLayers, float oParallaxMaxLayers) {
      float numLayers = mix(oParallaxMaxLayers, oParallaxMinLayers, abs(dot(vec3(0.0f, 0.0f, 1.0f), V)));
      float layerHeight = 1.0f / numLayers;
      float currentLayerHeight = 0.0f;
      vec2 dtex = parallaxScale  * V.xy / V.z / numLayers;
      vec2 currentTextureCoords = vUv;
      float heightFromTexture = 1.f - texture2D(ParallaxOcclusionMap, currentTextureCoords).r;

      int qualityMod = int(oParallaxMaxLayers/2.)+32;

      for (int i = 0; i < qualityMod; i += 1) {
        if (heightFromTexture <= currentLayerHeight) {
          break;
        }
        currentLayerHeight += layerHeight;
        currentTextureCoords -= dtex;
    
        heightFromTexture = 1.f - texture2D(ParallaxOcclusionMap, currentTextureCoords).r;
      }
   
      vec2 deltaTexCoord = dtex / 2.0f;
      float deltaHeight = layerHeight / 2.0f;
      currentTextureCoords += deltaTexCoord;
      currentLayerHeight -= deltaHeight;
      int numSearches = 4 + int(oParallaxMaxLayers/16.);
      for (int i = 0; i < numSearches; i += 1) {
        deltaTexCoord /= 2.0f;
        deltaHeight /= 2.0f;
        heightFromTexture = 1.f - texture2D(ParallaxOcclusionMap, currentTextureCoords).r;
        if (heightFromTexture > currentLayerHeight) {
          currentTextureCoords -= deltaTexCoord;
          currentLayerHeight += deltaHeight;
        } else {
          currentTextureCoords += deltaTexCoord;
          currentLayerHeight -= deltaHeight;
        }
      }
      return currentTextureCoords;         
    }
    
    vec3 warpUVs(vec3 surfPosition, vec3 surfNormal, vec3 viewPosition) {
      vec3 dp1 = dFdx(surfPosition);
      vec3 dp2 = dFdy(surfPosition);
    
      vec2 duv1 = dFdx(vUv);
      vec2 duv2 = dFdy(vUv);
    
      vec3 dp2perp = cross(dp2, surfNormal);
      vec3 dp1perp = cross(surfNormal, dp1);
    
      vec3 N = surfNormal;
      vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
      vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
    
      // construct a scale-invariant frame 
      float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
      mat3 v = mat3(T * invmax, B * invmax, N);
      return viewPosition * v;
    }
     `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <clipping_planes_fragment>`,
      /*glsl*/ `
      

      float viewDirModifier = (1. - pow(vCosTheta, 1.))*0.45 +0.2;
      float steepViewDirModifier = (1. - clamp(pow((vCosTheta)*1., 2.),0.,1.))*0.6 + 0.01;

      float combinedViewDirMod = clamp(viewDirModifier + steepViewDirModifier,0.,1.);

      
      float distanceModifier = clamp(cutoffDistance - vDistance, 0.0,1.0) * clamp((cutoffDistance/vDistance - 1.)* 0.5, 0.0, 1.0);

      float qualityMod = combinedViewDirMod * distanceModifier;
      
      
      vec2 parallaxedUv = vUv;

      if(qualityMod > 0.01){
        float oParallaxMinLayers = clamp(parallaxMinLayers * distanceModifier, 1., parallaxMinLayers);
        float oParallaxMaxLayers = clamp(parallaxMaxLayers * qualityMod, 2., parallaxMaxLayers);
  
        vec3 warpVector = warpUVs(-vViewPosition, normalize(vNormal), normalize(vViewPosition));
        parallaxedUv = parallaxMap(warpVector, parallaxScale, oParallaxMinLayers, oParallaxMaxLayers);        
      }

      vec2 currentTextureCoords = parallaxedUv / repeatUv;
      // todo optional
      // if (currentTextureCoords.x > 1.0f || currentTextureCoords.x < 0.0f || currentTextureCoords.y < 0.f || currentTextureCoords.y > 1.f)
      //   discard;     

      
      
 
      ${parallaxUv}
      #include <clipping_planes_fragment>`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      /*glsl*/ `
      #include <dithering_fragment>
      
      #ifdef QUALITY_MASK_DEBUG
        gl_FragColor = vec4(vec3(qualityMod), 1.f);
      #endif
      `
    );
  }

  get parallaxOcclusionMap() {
    return this.ParallaxOcclusionMap.value;
  }
  set parallaxOcclusionMap(texture: any) {
    this.ParallaxOcclusionMap.value = texture;
  }

  get repeatUv() {
    return this.RepeatUv.value;
  }
  set repeatUv(repeatV2: Vector2) {
    this.RepeatUv.value = repeatV2;
  }

  get parallaxScale() {
    return this.ParallaxScale.value;
  }
  set parallaxScale(parallax: number) {
    this.ParallaxScale.value = parallax;
  }

  get parallaxMinLayers() {
    return this.ParallaxMinLayers.value;
  }
  set parallaxMinLayers(minLayers: number) {
    this.ParallaxMinLayers.value = minLayers;
  }

  get parallaxMaxLayers() {
    return this.ParallaxMaxLayers.value;
  }
  set parallaxMaxLayers(maxLayers: number) {
    this.ParallaxMaxLayers.value = maxLayers;
  }

  get qualityCutoffDistance() {
    return this.CutoffDistance.value;
  }
  set qualityCutoffDistance(distance: number) {
    this.CutoffDistance.value = distance;
  }
}
