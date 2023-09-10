#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
uniform float ior;
#endif
#ifdef USE_SPECULAR
uniform float specularIntensity;
uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
uniform float clearcoat;
uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
uniform float iridescence;
uniform float iridescenceIOR;
uniform float iridescenceThicknessMinimum;
uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
uniform vec3 sheenColor;
uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

varying vec2 vUv;
varying vec3 tkWorldPosition;

uniform sampler2D ParallaxOcclusionMap;
uniform vec2 repeatUv;

#define USE_OCLUSION_PARALLAX;

float parallaxScale = 0.1f;
float parallaxMinLayers = 64.f;
float parallaxMaxLayers = 96.f;

vec2 parallaxMap(in vec3 V) {
  float numLayers = mix(parallaxMaxLayers, parallaxMinLayers, abs(dot(vec3(0.0f, 0.0f, 1.0f), V)));
  float layerHeight = 1.0f / numLayers;
  float currentLayerHeight = 0.0f;
  vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
  vec2 currentTextureCoords = vUv;
  float heightFromTexture = 1.f - texture2D(ParallaxOcclusionMap, currentTextureCoords).r;
  for (int i = 0; i < 64; i += 1) {
    if (heightFromTexture <= currentLayerHeight) {
      break;
    }
    currentLayerHeight += layerHeight;
    currentTextureCoords -= dtex;

    heightFromTexture = 1.f - texture2D(ParallaxOcclusionMap, currentTextureCoords).r;
  }

  #ifdef USE_RELIEF_PARALLAX
  vec2 deltaTexCoord = dtex / 2.0f;
  float deltaHeight = layerHeight / 2.0f;
  currentTextureCoords += deltaTexCoord;
  currentLayerHeight -= deltaHeight;
  const int numSearches = 5;
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

  #elif defined( USE_OCLUSION_PARALLAX )
  vec2 prevTCoords = currentTextureCoords + dtex;
  float nextH = heightFromTexture - currentLayerHeight;
  float prevH = 1.f - texture2D(ParallaxOcclusionMap, prevTCoords).r - currentLayerHeight + layerHeight;
  float weight = nextH / (nextH - prevH);

  vec2 oUv = prevTCoords * weight + currentTextureCoords * (1.0f - weight);
  return oUv;
  #else
  return vUv;
  #endif
}

vec2 warpUVs(vec3 surfPosition, vec3 surfNormal, vec3 viewPosition) {
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

  return parallaxMap(viewPosition * v);
}

void main() {
  parallaxScale += parallaxScale * repeatUv.x * 0.00f;

	#include <clipping_planes_fragment>
  vec4 diffuseColor = vec4(diffuse, opacity);
  ReflectedLight reflectedLight = ReflectedLight(vec3(0.0f), vec3(0.0f), vec3(0.0f), vec3(0.0f));
  vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>

  vec2 mapUv = warpUVs(-vViewPosition, normalize(vNormal), normalize(vViewPosition));

  vec2 currentTextureCoords = mapUv / repeatUv;

  if (currentTextureCoords.x > 1.0f || currentTextureCoords.x < 0.0f || currentTextureCoords.y < 0.f || currentTextureCoords.y > 1.f)
    discard;
  vec2 parallaxedUv = mapUv;

  #ifdef USE_MAP

  vec4 sampledDiffuseColor = texture2D(map, parallaxedUv);

	#ifdef DECODE_VIDEO_TEXTURE

		// use inline sRGB decode until browsers properly support SRGB8_APLHA8 with video textures

  sampledDiffuseColor = vec4(mix(pow(sampledDiffuseColor.rgb * 0.9478672986f + vec3(0.0521327014f), vec3(2.4f)), sampledDiffuseColor.rgb * 0.0773993808f, vec3(lessThanEqual(sampledDiffuseColor.rgb, vec3(0.04045f)))), sampledDiffuseColor.w);

	#endif

  diffuseColor *= sampledDiffuseColor;

#endif

	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#ifdef USE_NORMALMAP_OBJECTSPACE

  normal = texture2D(normalMap, parallaxedUv).xyz * 2.0f - 1.0f; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

  normal = -normal;

	#endif

	#ifdef DOUBLE_SIDED

  normal = normal * faceDirection;

	#endif

  normal = normalize(normalMatrix * normal);

#elif defined( USE_NORMALMAP_TANGENTSPACE )

  vec3 mapN = texture2D(normalMap, parallaxedUv).xyz * 2.0f - 1.0f;
  mapN.xy *= normalScale;

  normal = normalize(tbn * mapN);

#elif defined( USE_BUMPMAP )

  normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(), faceDirection);

#endif
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
  vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
  vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
  vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
  float sheenEnergyComp = 1.0f - 0.157f * max3(material.sheenColor);
  outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
  float dotNVcc = saturate(dot(geometry.clearcoatNormal, geometry.viewDir));
  vec3 Fcc = F_Schlick(material.clearcoatF0, material.clearcoatF90, dotNVcc);
  outgoingLight = outgoingLight * (1.0f - material.clearcoat * Fcc) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>

	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>

  float d2 = length(cameraPosition - tkWorldPosition) * 0.01f;

  vec3 viewDir = normalize(tkWorldPosition - cameraPosition);
  vec3 n = normalize(vNormal);

  float cosTheta = dot(viewDir, n);

  gl_FragColor = vec4(vec3(abs(cosTheta)), 1.f);

}