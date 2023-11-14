#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
varying vec3 vWorldPosition;
#endif
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2(const in float x) {
	return x * x;
}
vec3 pow2(const in vec3 x) {
	return x * x;
}
float pow3(const in float x) {
	return x * x * x;
}
float pow4(const in float x) {
	float x2 = x * x;
	return x2 * x2;
}
float max3(const in vec3 v) {
	return max(max(v.x, v.y), v.z);
}
float average(const in vec3 v) {
	return dot(v, vec3(0.3333333f));
}
highp float rand(const in vec2 uv) {
	const highp float a = 12.9898f, b = 78.233f, c = 43758.5453f;
	highp float dt = dot(uv.xy, vec2(a, b)), sn = mod(dt, PI);
	return fract(sin(sn) * c);
}
#ifdef HIGH_PRECISION
float precisionSafeLength(vec3 v) {
	return length(v);
}
#else
float precisionSafeLength(vec3 v) {
	float maxComponent = max3(abs(v));
	return length(v / maxComponent) * maxComponent;
}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
#ifdef USE_ALPHAHASH
varying vec3 vPosition;
#endif
vec3 transformDirection(in vec3 dir, in mat4 matrix) {
	return normalize((matrix * vec4(dir, 0.0f)).xyz);
}
vec3 inverseTransformDirection(in vec3 dir, in mat4 matrix) {
	return normalize((vec4(dir, 0.0f) * matrix).xyz);
}
mat3 transposeMat3(const in mat3 m) {
	mat3 tmp;
	tmp[0] = vec3(m[0].x, m[1].x, m[2].x);
	tmp[1] = vec3(m[0].y, m[1].y, m[2].y);
	tmp[2] = vec3(m[0].z, m[1].z, m[2].z);
	return tmp;
}
float luminance(const in vec3 rgb) {
	const vec3 weights = vec3(0.2126729f, 0.7151522f, 0.0721750f);
	return dot(weights, rgb);
}
bool isPerspectiveMatrix(mat4 m) {
	return m[2][3] == -1.0f;
}
vec2 equirectUv(in vec3 dir) {
	float u = atan(dir.z, dir.x) * RECIPROCAL_PI2 + 0.5f;
	float v = asin(clamp(dir.y, -1.0f, 1.0f)) * RECIPROCAL_PI + 0.5f;
	return vec2(u, v);
}
vec3 BRDF_Lambert(const in vec3 diffuseColor) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick(const in vec3 f0, const in float f90, const in float dotVH) {
	float fresnel = exp2((-5.55473f * dotVH - 6.98316f) * dotVH);
	return f0 * (1.0f - fresnel) + (f90 * fresnel);
}
float F_Schlick(const in float f0, const in float f90, const in float dotVH) {
	float fresnel = exp2((-5.55473f * dotVH - 6.98316f) * dotVH);
	return f0 * (1.0f - fresnel) + (f90 * fresnel);
} // validated
#if defined( USE_UV ) || defined( USE_ANISOTROPY )
varying vec2 vUv;
#endif
#ifdef USE_MAP
uniform mat3 mapTransform;
varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
uniform mat3 alphaMapTransform;
varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
uniform mat3 lightMapTransform;
varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
uniform mat3 aoMapTransform;
varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
uniform mat3 bumpMapTransform;
varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
uniform mat3 normalMapTransform;
varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
uniform mat3 displacementMapTransform;
varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
uniform mat3 emissiveMapTransform;
varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
uniform mat3 metalnessMapTransform;
varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
uniform mat3 roughnessMapTransform;
varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
uniform mat3 anisotropyMapTransform;
varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
uniform mat3 clearcoatMapTransform;
varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
uniform mat3 clearcoatNormalMapTransform;
varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
uniform mat3 clearcoatRoughnessMapTransform;
varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
uniform mat3 sheenColorMapTransform;
varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
uniform mat3 sheenRoughnessMapTransform;
varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
uniform mat3 iridescenceMapTransform;
varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
uniform mat3 iridescenceThicknessMapTransform;
varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
uniform mat3 specularMapTransform;
varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
uniform mat3 specularColorMapTransform;
varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
uniform mat3 specularIntensityMapTransform;
varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
uniform mat3 transmissionMapTransform;
varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
uniform mat3 thicknessMapTransform;
varying vec2 vThicknessMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
uniform sampler2D displacementMap;
uniform float displacementScale;
uniform float displacementBias;
#endif
#if defined( USE_COLOR_ALPHA )
varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
varying vec3 vColor;
#endif
#ifdef USE_FOG
varying float vFogDepth;
#endif
#ifndef FLAT_SHADED
varying vec3 vNormal;
	#ifdef USE_TANGENT
varying vec3 vTangent;
varying vec3 vBitangent;
	#endif
#endif
#ifdef USE_MORPHTARGETS
uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
uniform float morphTargetInfluences[MORPHTARGETS_COUNT];
uniform sampler2DArray morphTargetsTexture;
uniform ivec2 morphTargetsTextureSize;
vec4 getMorph(const in int vertexIndex, const in int morphTargetIndex, const in int offset) {
	int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
	int y = texelIndex / morphTargetsTextureSize.x;
	int x = texelIndex - y * morphTargetsTextureSize.x;
	ivec3 morphUV = ivec3(x, y, morphTargetIndex);
	return texelFetch(morphTargetsTexture, morphUV, 0);
}
	#else
		#ifndef USE_MORPHNORMALS
uniform float morphTargetInfluences[8];
		#else
uniform float morphTargetInfluences[4];
		#endif
	#endif
#endif
#ifdef USE_SKINNING
uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
uniform highp sampler2D boneTexture;
uniform int boneTextureSize;
mat4 getBoneMatrix(const in float i) {
	float j = i * 4.0f;
	float x = mod(j, float(boneTextureSize));
	float y = floor(j / float(boneTextureSize));
	float dx = 1.0f / float(boneTextureSize);
	float dy = 1.0f / float(boneTextureSize);
	y = dy * (y + 0.5f);
	vec4 v1 = texture2D(boneTexture, vec2(dx * (x + 0.5f), y));
	vec4 v2 = texture2D(boneTexture, vec2(dx * (x + 1.5f), y));
	vec4 v3 = texture2D(boneTexture, vec2(dx * (x + 2.5f), y));
	vec4 v4 = texture2D(boneTexture, vec2(dx * (x + 3.5f), y));
	mat4 bone = mat4(v1, v2, v3, v4);
	return bone;
}
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
uniform mat4 spotLightMatrix[NUM_SPOT_LIGHT_COORDS];
varying vec4 vSpotLightCoord[NUM_SPOT_LIGHT_COORDS];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
uniform mat4 directionalShadowMatrix[NUM_DIR_LIGHT_SHADOWS];
varying vec4 vDirectionalShadowCoord[NUM_DIR_LIGHT_SHADOWS];
struct DirectionalLightShadow {
	float shadowBias;
	float shadowNormalBias;
	float shadowRadius;
	vec2 shadowMapSize;
};
uniform DirectionalLightShadow directionalLightShadows[NUM_DIR_LIGHT_SHADOWS];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
struct SpotLightShadow {
	float shadowBias;
	float shadowNormalBias;
	float shadowRadius;
	vec2 shadowMapSize;
};
uniform SpotLightShadow spotLightShadows[NUM_SPOT_LIGHT_SHADOWS];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
uniform mat4 pointShadowMatrix[NUM_POINT_LIGHT_SHADOWS];
varying vec4 vPointShadowCoord[NUM_POINT_LIGHT_SHADOWS];
struct PointLightShadow {
	float shadowBias;
	float shadowNormalBias;
	float shadowRadius;
	vec2 shadowMapSize;
	float shadowCameraNear;
	float shadowCameraFar;
};
uniform PointLightShadow pointLightShadows[NUM_POINT_LIGHT_SHADOWS];
	#endif
#endif
#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
varying float vFragDepth;
varying float vIsPerspective;
	#else
uniform float logDepthBufFC;
	#endif
#endif
#if NUM_CLIPPING_PLANES > 0
varying vec3 vClipPosition;
#endif
void main() {
#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3(uv, 1).xy;
#endif
#ifdef USE_MAP
	vMapUv = (mapTransform * vec3(MAP_UV, 1)).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = (alphaMapTransform * vec3(ALPHAMAP_UV, 1)).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = (lightMapTransform * vec3(LIGHTMAP_UV, 1)).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = (aoMapTransform * vec3(AOMAP_UV, 1)).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = (bumpMapTransform * vec3(BUMPMAP_UV, 1)).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = (normalMapTransform * vec3(NORMALMAP_UV, 1)).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = (displacementMapTransform * vec3(DISPLACEMENTMAP_UV, 1)).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = (emissiveMapTransform * vec3(EMISSIVEMAP_UV, 1)).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = (metalnessMapTransform * vec3(METALNESSMAP_UV, 1)).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = (roughnessMapTransform * vec3(ROUGHNESSMAP_UV, 1)).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = (anisotropyMapTransform * vec3(ANISOTROPYMAP_UV, 1)).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = (clearcoatMapTransform * vec3(CLEARCOATMAP_UV, 1)).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = (clearcoatNormalMapTransform * vec3(CLEARCOAT_NORMALMAP_UV, 1)).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = (clearcoatRoughnessMapTransform * vec3(CLEARCOAT_ROUGHNESSMAP_UV, 1)).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = (iridescenceMapTransform * vec3(IRIDESCENCEMAP_UV, 1)).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = (iridescenceThicknessMapTransform * vec3(IRIDESCENCE_THICKNESSMAP_UV, 1)).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = (sheenColorMapTransform * vec3(SHEEN_COLORMAP_UV, 1)).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = (sheenRoughnessMapTransform * vec3(SHEEN_ROUGHNESSMAP_UV, 1)).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = (specularMapTransform * vec3(SPECULARMAP_UV, 1)).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = (specularColorMapTransform * vec3(SPECULAR_COLORMAP_UV, 1)).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = (specularIntensityMapTransform * vec3(SPECULAR_INTENSITYMAP_UV, 1)).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = (transmissionMapTransform * vec3(TRANSMISSIONMAP_UV, 1)).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = (thicknessMapTransform * vec3(THICKNESSMAP_UV, 1)).xy;
#endif
#if defined( USE_COLOR_ALPHA )
	vColor = vec4(1.0f);
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3(1.0f);
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for (int i = 0; i < MORPHTARGETS_COUNT; i++) {
		#if defined( USE_COLOR_ALPHA )
		if (morphTargetInfluences[i] != 0.0f)
			vColor += getMorph(gl_VertexID, i, 2) * morphTargetInfluences[i];
		#elif defined( USE_COLOR )
		if (morphTargetInfluences[i] != 0.0f)
			vColor += getMorph(gl_VertexID, i, 2).rgb * morphTargetInfluences[i];
		#endif
	}
#endif
	vec3 objectNormal = vec3(normal);
#ifdef USE_TANGENT
	vec3 objectTangent = vec3(tangent.xyz);
#endif
#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
	for (int i = 0; i < MORPHTARGETS_COUNT; i++) {
		if (morphTargetInfluences[i] != 0.0f)
			objectNormal += getMorph(gl_VertexID, i, 1).xyz * morphTargetInfluences[i];
	}
	#else
	objectNormal += morphNormal0 * morphTargetInfluences[0];
	objectNormal += morphNormal1 * morphTargetInfluences[1];
	objectNormal += morphNormal2 * morphTargetInfluences[2];
	objectNormal += morphNormal3 * morphTargetInfluences[3];
	#endif
#endif
#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix(skinIndex.x);
	mat4 boneMatY = getBoneMatrix(skinIndex.y);
	mat4 boneMatZ = getBoneMatrix(skinIndex.z);
	mat4 boneMatW = getBoneMatrix(skinIndex.w);
#endif
#ifdef USE_SKINNING
	mat4 skinMatrix = mat4(0.0f);
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4(skinMatrix * vec4(objectNormal, 0.0f)).xyz;
	#ifdef USE_TANGENT
	objectTangent = vec4(skinMatrix * vec4(objectTangent, 0.0f)).xyz;
	#endif
#endif
	vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3(instanceMatrix);
	transformedNormal /= vec3(dot(m[0], m[0]), dot(m[1], m[1]), dot(m[2], m[2]));
	transformedNormal = m * transformedNormal;
#endif
	transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = -transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = (modelViewMatrix * vec4(objectTangent, 0.0f)).xyz;
	#ifdef FLIP_SIDED
	transformedTangent = -transformedTangent;
	#endif
#endif
#ifndef FLAT_SHADED
	vNormal = normalize(transformedNormal);
	#ifdef USE_TANGENT
	vTangent = normalize(transformedTangent);
	vBitangent = normalize(cross(vNormal, vTangent) * tangent.w);
	#endif
#endif
	vec3 transformed = vec3(position);
#ifdef USE_ALPHAHASH
	vPosition = vec3(position);
#endif
#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
	for (int i = 0; i < MORPHTARGETS_COUNT; i++) {
		if (morphTargetInfluences[i] != 0.0f)
			transformed += getMorph(gl_VertexID, i, 0).xyz * morphTargetInfluences[i];
	}
	#else
	transformed += morphTarget0 * morphTargetInfluences[0];
	transformed += morphTarget1 * morphTargetInfluences[1];
	transformed += morphTarget2 * morphTargetInfluences[2];
	transformed += morphTarget3 * morphTargetInfluences[3];
		#ifndef USE_MORPHNORMALS
	transformed += morphTarget4 * morphTargetInfluences[4];
	transformed += morphTarget5 * morphTargetInfluences[5];
	transformed += morphTarget6 * morphTargetInfluences[6];
	transformed += morphTarget7 * morphTargetInfluences[7];
		#endif
	#endif
#endif
#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4(transformed, 1.0f);
	vec4 skinned = vec4(0.0f);
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = (bindMatrixInverse * skinned).xyz;
#endif
#ifdef USE_DISPLACEMENTMAP
	transformed += normalize(objectNormal) * (texture2D(displacementMap, vDisplacementMapUv).x * displacementScale + displacementBias);
#endif
	vec4 mvPosition = vec4(transformed, 1.0f);
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
	mvPosition = modelViewMatrix * mvPosition;
	gl_Position = projectionMatrix * mvPosition;
#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
	vFragDepth = 1.0f + gl_Position.w;
	vIsPerspective = float(isPerspectiveMatrix(projectionMatrix));
	#else
	if (isPerspectiveMatrix(projectionMatrix)) {
		gl_Position.z = log2(max(EPSILON, gl_Position.w + 1.0f)) * logDepthBufFC - 1.0f;
		gl_Position.z *= gl_Position.w;
	}
	#endif
#endif
#if NUM_CLIPPING_PLANES > 0
	vClipPosition = -mvPosition.xyz;
#endif
	vViewPosition = -mvPosition.xyz;
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4(transformed, 1.0f);
	#ifdef USE_INSTANCING
	worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif
#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection(transformedNormal, viewMatrix);
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
	for (int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i++) {
		shadowWorldPosition = worldPosition + vec4(shadowWorldNormal * directionalLightShadows[i].shadowNormalBias, 0);
		vDirectionalShadowCoord[i] = directionalShadowMatrix[i] * shadowWorldPosition;
	}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
	for (int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i++) {
		shadowWorldPosition = worldPosition + vec4(shadowWorldNormal * pointLightShadows[i].shadowNormalBias, 0);
		vPointShadowCoord[i] = pointShadowMatrix[i] * shadowWorldPosition;
	}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for (int i = 0; i < NUM_SPOT_LIGHT_COORDS; i++) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[i].shadowNormalBias;
		#endif
		vSpotLightCoord[i] = spotLightMatrix[i] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif
#ifdef USE_FOG
	vFogDepth = -mvPosition.z;
#endif
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}
