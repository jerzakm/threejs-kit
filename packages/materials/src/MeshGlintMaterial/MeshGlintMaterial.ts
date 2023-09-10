import { MeshPhysicalMaterial, Vector3, type Shader } from "three";
import glintMathChunks from "./mesh_glint_frag.glsl?raw";

export class MeshGlintMaterial extends MeshPhysicalMaterial {
  private LightIntensity = { value: new Vector3() };
  private LightPosition = { value: new Vector3() };
  private CameraPosition = { value: new Vector3() };
  private LogMicrofacetDensity = { value: 1 };
  private Alpha_x = { value: 1 };
  private Alpha_y = { value: 1 };
  private MicrofacetRelativeArea = { value: 1 };
  private MaxAnisotropy = { value: 16 };
  private DictionaryTexture = { value: null };
  private NLevels = { value: 16 };
  private Alpha = { value: 0.5 };
  private N = { value: 64 * 3 };
  private Pyramid0Size = { value: 1 << (16 - 1) };

  constructor(parameters = {}) {
    super(parameters);
    console.log(parameters);
    this.setValues(parameters);
  }
  onBeforeCompile(shader: Shader) {
    shader.uniforms.LightIntensity = this.LightIntensity;
    shader.uniforms.LightPosition = this.LightPosition;
    shader.uniforms.CameraPosition = this.CameraPosition;
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

      varying vec2 TexCoord;
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
      TexCoord = uv ;
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

      
		  // VertexPos = (modelViewMatrix * vec4(position, 1.f)).xyz;
      vModelViewMatrix = modelViewMatrix;
		  // VertexPos = normalize(VertexPos);
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <clipping_planes_pars_fragment>`,
      /*glsl*/ `
      #include <clipping_planes_pars_fragment>

		  varying vec2 TexCoord;
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
      uniform vec3 CameraPosition;

      uniform mediump sampler2DArray DictionaryTexture;

      mat4 brightnessMatrix(float brightness) {
        return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, brightness, brightness, brightness, 1);
      }
      
      mat4 contrastMatrix(float contrast) {
        float t = (1.0f - contrast) / 2.0f;
      
        return mat4(contrast, 0, 0, 0, 0, contrast, 0, 0, 0, 0, contrast, 0, t, t, t, 1);
      
      }
      ${glintMathChunks}
      // linear to tonemapped
vec3 ACES(vec3 x) {
    return x*(2.51*x + .03) / (x*(2.43*x + .59) + .14); // https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
}

// tonemapped to linear
vec3 ACES_Inv(vec3 x) {
    return (sqrt(-10127.*x*x + 13702.*x + 9.) + 59.*x - 3.) / (502. - 486.*x); // thanks to https://www.wolframalpha.com/input?i=2.51y%5E2%2B.03y%3Dx%282.43y%5E2%2B.59y%2B.14%29+solve+for+y
}
vec3 changeExposure(vec3 col, vec3 b) {
  b *= col;
  return b/(b-col+1.);
}

vec3 changeExposure(vec3 col, float b) {
  return changeExposure(col, vec3(b));
}
		  `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;`,
      /*glsl*/ `
      vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
      ///GLINT STARTS HERE
      
      // Texture position
      vec2 uv = TexCoord * 1.f;
      vec3 VN = gl_FrontFacing ? VertexNorm : -VertexNorm;
      vec3 vertexBinormal = cross(VertexNorm, VertexTang);

      // Matrix for transformation to tangent space
      mat3 toLocal = mat3(
        VertexTang.x, vertexBinormal.x, VertexNorm.x,
        VertexTang.y, vertexBinormal.y, VertexNorm.y,
        VertexTang.z, vertexBinormal.z, VertexNorm.z);


        
      vec3 vPos = vec3(VertexPos.x, VertexPos.y, VertexPos.z);
      vec3 lPos = vec3(LightPosition.x, LightPosition.y, LightPosition.z);
      vec3 cPos = vec3(CameraPosition.x, CameraPosition.y, CameraPosition.z);
    
      
      float distanceSquared = pow(distance(VertexPos, lPos), 2.);      
      
      
      vec3 wi = toLocal * normalize(lPos - vPos);
      vec3 wo = toLocal * normalize(cPos  - vPos);


  

      vec3 radiance_specular = vec3(0);
      vec3 radiance_diffuse = vec3(0.f);
      vec3 glint_radiance = vec3(0);

      vec3 Li = LightIntensity/ distanceSquared;

      radiance_diffuse = f_diffuse(wo, wi) * Li;

      // Call our physically based glinty BRDF
      radiance_specular = f_P(wo, wi, uv) * Li;


      glint_radiance = vec3(clamp(0.5f * radiance_specular.g, 0., 2.5));
      // glint_radiance = radiance_specular * 0.5;

      glint_radiance *= outgoingLight * 5.;

      glint_radiance = pow(glint_radiance, vec3(1.0 / 2.2));
      
      float gmod = clamp(radiance_specular.r * 0.5, 0.,2.5);

      vec3 diffuseGlint = gmod * (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse);
      vec3 specularGlint = totalSpecular * gmod;


      vec3 glintColor = diffuseGlint + specularGlint;
      

      
      diffuseGlint = 1. * glint_radiance * (reflectedLight.directDiffuse + reflectedLight.indirectDiffuse*0.7);
      specularGlint = 3. * totalSpecular * glint_radiance;
      // totalDiffuse = 0.95 * totalDiffuse;
      
      
      
      vec3 combinedGlint = pow(max(diffuseGlint + specularGlint,vec3(0.)), vec3(1.))*1. + totalDiffuse;
      
      // outgoingLight = glint_radiance;
      // outgoingLight = radiance_specular;

        
      // outgoingLight = mix(combinedGlint, totalDiffuse, 1.-totalSpecular.r);
      // outgoingLight = mix(combinedGlint, outgoingLight, 1.-gmod/2.5);

      // outgoingLight = diffuseGlint + specularGlint ;

      // outgoingLight = pow(outgoingLight, vec3(radiance_specular.r));

      // outgoingLight *= 0.1;
      outgoingLight += glint_radiance*glint_radiance;
      // outgoingLight += glint_radiance*outgoingLight;
      // outgoingLight*=0.9;
      // outgoingLight = pow(outgoingLight, vec3(1.0 / 2.2));

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

  get cameraPosition(): Vector3 {
    return this.CameraPosition.value;
  }
  set cameraPosition(position: Vector3) {
    this.CameraPosition.value = position;
  }

  get alphaX(): number {
    return this.Alpha_x.value;
  }
  set alphaX(alphaX: number) {
    this.Alpha_x.value = alphaX;
  }

  get alphaY(): number {
    return this.Alpha_y.value;
  }
  set alphaY(alphaY: number) {
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
