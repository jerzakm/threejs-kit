import {
  MeshPhysicalMaterial,
  Vector3,
  type Shader,
  MeshPhysicalMaterialParameters,
  DataArrayTexture,
} from "three";
import glintMathChunks from "./mesh_glint_frag.glsl?raw";

interface MeshGlintMaterialProps {
  lightIntensity?: Vector3;
  lightPosition?: Vector3;
  logMicrofacetDensity?: number;
  roughnessX?: number;
  roughnessY?: number;
  microfacetRelativeArea?: number;
  maxAnisotropy?: number;
  dictionaryTexture?: DataArrayTexture;
  nLevels?: number;
  alpha?: number;
  n?: number;
  pyramid0Size?: number;
}

export class MeshGlintMaterial extends MeshPhysicalMaterial {
  private LightIntensity = { value: new Vector3() };
  private LightPosition = { value: new Vector3() };
  private LogMicrofacetDensity = { value: 1 };
  private Alpha_x = { value: 1 };
  private Alpha_y = { value: 1 };
  private MicrofacetRelativeArea = { value: 1 };
  private MaxAnisotropy = { value: 16 };
  private DictionaryTexture: { value: DataArrayTexture | null } = {
    value: null,
  };
  private NLevels = { value: 16 };
  private Alpha = { value: 0.5 };
  private N = { value: 64 * 3 };
  private Pyramid0Size = { value: 1 << (16 - 1) };

  constructor(
    parameters: MeshPhysicalMaterialParameters = {},
    glintParameters: MeshGlintMaterialProps = {}
  ) {
    super(parameters);
    this.setValues(parameters);
    this.defines["USE_UV"] = "";

    if (glintParameters.lightIntensity)
      this.LightIntensity.value = glintParameters.lightIntensity;
    if (glintParameters.lightPosition)
      this.LightPosition.value = glintParameters.lightPosition;
    if (glintParameters.logMicrofacetDensity)
      this.LogMicrofacetDensity.value = glintParameters.logMicrofacetDensity;
    if (glintParameters.roughnessX)
      this.Alpha_x.value = glintParameters.roughnessX;
    if (glintParameters.roughnessY)
      this.Alpha_y.value = glintParameters.roughnessY;
    if (glintParameters.microfacetRelativeArea)
      this.MicrofacetRelativeArea.value =
        glintParameters.microfacetRelativeArea;
    if (glintParameters.maxAnisotropy)
      this.MaxAnisotropy.value = glintParameters.maxAnisotropy;
    if (glintParameters.dictionaryTexture)
      this.DictionaryTexture.value = glintParameters.dictionaryTexture;
    if (glintParameters.nLevels) this.NLevels.value = glintParameters.nLevels;
    if (glintParameters.alpha) this.Alpha.value = glintParameters.alpha;
    if (glintParameters.n) this.N.value = glintParameters.n;
    if (glintParameters.pyramid0Size)
      this.Pyramid0Size.value = glintParameters.pyramid0Size;
  }
  onBeforeCompile(shader: Shader) {
    shader.uniforms.LightIntensity = this.LightIntensity;
    shader.uniforms.LightPosition = this.LightPosition;
    shader.uniforms.LogMicrofacetDensity = this.LogMicrofacetDensity;
    shader.uniforms.Alpha_x = this.Alpha_x;
    shader.uniforms.Alpha_y = this.Alpha_y;
    shader.uniforms.MicrofacetRelativeArea = this.MicrofacetRelativeArea;
    shader.uniforms.MaxAnisotropy = this.MaxAnisotropy;
    shader.uniforms.DictionaryTexture = this.DictionaryTexture;
    shader.uniforms.NLevels = this.NLevels;
    shader.uniforms.Alpha = this.Alpha;
    shader.uniforms.N = this.N;
    shader.uniforms.Pyramid0Size = this.Pyramid0Size;

    shader.vertexShader = shader.vertexShader.replace(
      `#include <common>`,
      /*glsl*/ `
      #include <common>

      #ifndef USE_TANGENT
        attribute vec3 tangent;
      #endif

      varying vec3 VertexPos;
      varying vec3 VertexNorm;
      varying vec3 VertexTang;      

      varying mat4 vModelViewMatrix;
      `
    );

    shader.vertexShader = shader.vertexShader.replace(
      `#include <fog_vertex>`,
      /*glsl*/ `
      #include <fog_vertex>
      
		  VertexPos = position;
		  VertexNorm = normal;
		  VertexTang = tangent.xyz;

		  vec3 norm = normalize((modelViewMatrix * vec4(normal, 0.f)).xyz);
		  VertexNorm = norm;

		  vec3 tang = normalize((modelViewMatrix * vec4(tangent.xyz, 0.f)).xyz);
		  VertexTang = tang.xyz;


      vec4 localPosition = vec4( position, 1.);
      vec4 wp = modelMatrix * localPosition;
      VertexPos = wp.xyz;

      vModelViewMatrix = modelViewMatrix;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <clipping_planes_pars_fragment>`,
      /*glsl*/ `
      #include <clipping_planes_pars_fragment>

      varying vec3 VertexPos;
      varying vec3 VertexNorm;
      varying vec3 VertexTang;
      varying mat4 vModelViewMatrix;

      uniform float Alpha;      // Roughness of the dictionary (alpha_{dist} in the paper)
      uniform int N;            // Number of marginal distributions in the dictionary
      uniform int NLevels;      // Number of LOD in the dictionary
      uniform int Pyramid0Size; // Number of cells along one axis at LOD 0, for NLevels LODs, in a MIP hierarchy

      uniform float MicrofacetRelativeArea;
      uniform float MaxAnisotropy;
      uniform float LogMicrofacetDensity;
      uniform float Alpha_x;
      uniform float Alpha_y;
      uniform vec3 LightIntensity;
      uniform vec3 LightPosition;

      uniform mediump sampler2DArray DictionaryTexture;

      ${glintMathChunks}

		  `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;`,
      /*glsl*/ `
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      ///GLINT STARTS HERE
      
      // Texture position
      vec2 uv = vUv;
      vec3 VN = gl_FrontFacing ? VertexNorm : -VertexNorm;
      vec3 vertexBinormal = cross(VertexNorm, VertexTang);

      // Matrix for transformation to tangent space
      mat3 toLocal = mat3(
        VertexTang.x, vertexBinormal.x, VertexNorm.x,
        VertexTang.y, vertexBinormal.y, VertexNorm.y,
        VertexTang.z, vertexBinormal.z, VertexNorm.z);
        
      vec3 vPos = vec3(VertexPos.x, VertexPos.y, VertexPos.z);
      vec3 lPos = vec3(LightPosition.x, LightPosition.y, LightPosition.z);
      vec3 cPos = vec3(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    
      
      float distanceSquared = pow(distance(VertexPos, lPos), 2.);           
      
      vec3 wi = toLocal * normalize(lPos - vPos);
      vec3 wo = toLocal * normalize(cPos  - vPos);

      vec3 radiance_specular = vec3(0);
      vec3 radiance_diffuse = vec3(0.f);
      vec3 glint_radiance = vec3(0);

      vec3 Li = (LightIntensity* 10000.) / distanceSquared;

      radiance_diffuse = f_diffuse(wo, wi) * Li;

      // Call our physically based glinty BRDF
      radiance_specular = f_P(wo, wi, uv) * Li;

      glint_radiance = vec3(clamp(0.5f * radiance_specular.g, 0., 2.5));
      glint_radiance *= outgoingLight * 7.62;
      glint_radiance = pow(glint_radiance, vec3(1.0 / 2.2));
      
      float gmod = clamp(radiance_specular.r * 0.5, 0.,3.5);

      vec3 diffuseGlint = gmod * (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse);
      vec3 specularGlint = totalSpecular * gmod;

      vec3 glintColor = diffuseGlint + specularGlint;     
     
      diffuseGlint = 1. * glint_radiance * (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse*0.7);
      specularGlint = 3. * totalSpecular * glint_radiance;
                   
      vec3 combinedGlint = pow(max(diffuseGlint + specularGlint,vec3(0.)), vec3(1.))*1. + totalDiffuse;      
      outgoingLight += glint_radiance*glint_radiance;      
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>
      // gl_FragColor = vec4(glint_radiance,1.);
      // gl_FragColor = vec4(radiance_specular, 1.);
      // gl_FragColor = vec4(VertexPos,1.);
      // gl_FragColor = vec4(vec3(1.),1.);
      `
    );
  }

  get lightIntensity(): Vector3 {
    return this.LightIntensity.value;
  }
  set lightIntensity(intensity3: Vector3) {
    this.LightIntensity.value = intensity3;
  }

  get lightPosition(): Vector3 {
    return this.LightPosition.value;
  }
  set lightPosition(position: Vector3) {
    this.LightPosition.value = position;
  }

  get roughnessX(): number {
    return this.Alpha_x.value;
  }
  set roughnessX(alphaX: number) {
    this.Alpha_x.value = alphaX;
  }

  get roughnessY(): number {
    return this.Alpha_y.value;
  }
  set roughnessY(alphaY: number) {
    this.Alpha_y.value = alphaY;
  }

  get microfacetRelativeArea(): number {
    return this.MicrofacetRelativeArea.value;
  }
  set microfacetRelativeArea(area: number) {
    this.MicrofacetRelativeArea.value = area;
  }

  get maxAnisotropy(): number {
    return this.MaxAnisotropy.value;
  }
  set maxAnisotropy(maxAnisotropy: number) {
    this.MaxAnisotropy.value = maxAnisotropy;
  }

  get glintAlpha(): number {
    return this.Alpha.value;
  }
  set glintAlpha(alpha: number) {
    this.Alpha.value = alpha;
  }

  get logMicrofacetDensity(): number {
    return this.LogMicrofacetDensity.value;
  }
  set logMicrofacetDensity(density: number) {
    this.LogMicrofacetDensity.value = density;
  }

  get dictionaryTexture() {
    return this.DictionaryTexture;
  }
  set dictionaryTexture(texture: any) {
    this.DictionaryTexture.value = texture;
  }
}
