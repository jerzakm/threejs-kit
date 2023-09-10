
//=========================================================================================================================
//================================================ Mathematical constants =================================================
//=========================================================================================================================
const float m_pi = 3.141592f;       /* MathConstant: m_pi                                 */
const float Im_pi = 0.318309f;     /* MathConstant: 1 / m_pi                             */
const float ISQRT2 = 0.707106f; /* MathConstant: 1/sqrt(2)                          */

//=========================================================================================================================
//================================================== Material parameters ==================================================
//==================================================== Can be changed =====================================================
//=========================================================================================================================
# define VARNISHED true

//=========================================================================================================================
//=============================================== Beckmann anisotrom_pic NDF ================================================
//==================== Shadertoy implementation : Arthur Cavalier (https://www.shadertoy.com/user/H4w0) ===================
//========================================= https://www.shadertoy.com/view/WlGXRt =========================================
//=========================================================================================================================

//-----------------------------------------------------------------------------
//-- Beckmann distribution ----------------------------------------------------
float p22_beckmann_anisotrom_pic(float x, float y, float Alpha_x, float Alpha_y) {
  float x_sqr = x * x;
  float y_sqr = y * y;
  float sigma_x = Alpha_x * ISQRT2;
  float sigma_y = Alpha_y * ISQRT2;
  float sigma_x_sqr = sigma_x * sigma_x;
  float sigma_y_sqr = sigma_y * sigma_y;
  return exp(-0.5f * ((x_sqr / sigma_x_sqr) + (y_sqr / sigma_y_sqr))) / (2.f * m_pi * sigma_x * sigma_y);
}

float ndf_beckmann_anisotrom_pic(vec3 omega_h, float Alpha_x, float Alpha_y) {
  float slope_x = -(omega_h.x / omega_h.z);
  float slope_y = -(omega_h.y / omega_h.z);
  float cos_theta = omega_h.z;
  float cos_2_theta = cos_theta * cos_theta;
  float cos_4_theta = cos_2_theta * cos_2_theta;
  float beckmann_p22 = p22_beckmann_anisotrom_pic(slope_x, slope_y, Alpha_x, Alpha_y);
  return beckmann_p22 / cos_4_theta;
}

//=========================================================================================================================
//======================================== Schlick approximation of Fresnel ===============================================
//=========================================================================================================================
vec3 fresnel_schlick(in float wo_dot_wh, in vec3 F0) {
  return F0 + (1.f - F0) * pow(1.f - wo_dot_wh, 5.f);
}

//=========================================================================================================================
//===================================== Microfacet BRDF of Cook and Torrance 1982 =========================================
//=========================================================================================================================
vec3 f_specular(vec3 wo, vec3 wi) {
  if (wo.z <= 0.f)
    return vec3(0.f, 0.f, 0.f);
  if (wi.z <= 0.f)
    return vec3(0.f, 0.f, 0.f);
  vec3 wh = normalize(wo + wi);
  if (wh.z <= 0.f)
    return vec3(0.f, 0.f, 0.f);
    // Local masking shadowing
  if (dot(wo, wh) <= 0.f || dot(wi, wh) <= 0.f)
    return vec3(0.f);
  float wi_dot_wh = clamp(dot(wi, wh), 0.f, 1.f);

  float D = ndf_beckmann_anisotrom_pic(wh, 0.1f, 0.1f);
    // V-cavity masking shadowing
  float G1wowh = min(1.f, 2.f * wh.z * wo.z / dot(wo, wh));
  float G1wiwh = min(1.f, 2.f * wh.z * wi.z / dot(wi, wh));
  float G = G1wowh * G1wiwh;

  vec3 F = fresnel_schlick(wi_dot_wh, vec3(1.f, 1.f, 1.f));

  return (D * F * G) / (4.f * wo.z);
}

//=========================================================================================================================
//=============================================== Diffuse Lambertian BRDF =================================================
//=========================================================================================================================
vec3 f_diffuse(vec3 wo, vec3 wi) {
  // if (wo.z <= 0.f)
  //   return vec3(0.f, 0.f, 0.f);
  // if (wi.z <= 0.f)
  //   return vec3(0.f, 0.f, 0.f);

  return vec3(1.0f) * Im_pi * wi.z;
}

//=========================================================================================================================
//=============================================== Inverse error function ==================================================
//=========================================================================================================================
float erfinv(float x) {
  float w, p;
  w = -log((1.0f - x) * (1.0f + x));
  if (w < 5.000000f) {
    w = w - 2.500000f;
    p = 2.81022636e-08f;
    p = 3.43273939e-07f + p * w;
    p = -3.5233877e-06f + p * w;
    p = -4.39150654e-06f + p * w;
    p = 0.00021858087f + p * w;
    p = -0.00125372503f + p * w;
    p = -0.00417768164f + p * w;
    p = 0.246640727f + p * w;
    p = 1.50140941f + p * w;
  } else {
    w = sqrt(w) - 3.000000f;
    p = -0.000200214257f;
    p = 0.000100950558f + p * w;
    p = 0.00134934322f + p * w;
    p = -0.00367342844f + p * w;
    p = 0.00573950773f + p * w;
    p = -0.0076224613f + p * w;
    p = 0.00943887047f + p * w;
    p = 1.00167406f + p * w;
    p = 2.83297682f + p * w;
  }
  return p * x;
}

//=========================================================================================================================
//================================================== Hash function ========================================================
//================================================== Inigo Quilez =========================================================
//====================================== https://www.shadertoy.com/view/llGSzw ============================================
//=========================================================================================================================

float hashIQ(uint n) {
    // integer hash com_pied from Hugo Elias
  n = (n << 13U) ^ n;
  n = n * (n * n * 15731U + 789221U) + 1376312589U;
  return float(n & 0x7fffffffU) / float(0x7fffffff);
}

//=========================================================================================================================
//=============================================== Pyramid size at LOD level ===============================================
//=========================================================================================================================

int pyramidSize(int level) {
  return int(pow(2.f, float(NLevels - 1 - level)));
}

float normalDistribution1D(float x, float mean, float std_dev) {
  float xMinusMean = x - mean;
  float xMinusMeanSqr = xMinusMean * xMinusMean;
  return exp(-xMinusMeanSqr / (2.f * std_dev * std_dev)) /
    (std_dev * 2.506628f);
    // 2.506628 \approx sqrt(2 * \m_pi)
}

//=========================================================================================================================
//========================================= Sampling from a Normal distribution ===========================================
//=========================================================================================================================
float sampleNormalDistribution(float U, float mu, float sigma) {
  float x = sigma * 1.414213f * erfinv(2.0f * U - 1.0f) + mu;
  return x;
}

//=========================================================================================================================
//=================== Spatially-varying, multiscale, rotated, and scaled slope distribution function ======================
//================================================= Eq. 11, Alg. 3 ========================================================
//=========================================================================================================================
float P22_theta_alpha(vec2 slope_h, int l, int s0, int t0) {
    // Coherent index
    // Eq. 8, Alg. 3, line 1
  int twoToTheL = int(pow(2.f, float(l)));
  s0 *= twoToTheL;
  t0 *= twoToTheL;

    // Seed pseudo random generator
    // Alg. 3, line 2
  int rngSeed = s0 + 1549 * t0;

   // Alg.3, line 3
  float uMicrofacetRelativeArea = hashIQ(uint(rngSeed) * 13U);
    // Discard cells by using microfacet relative area
    // Alg.3, line 4
  if (uMicrofacetRelativeArea > MicrofacetRelativeArea)
    return 0.f;

    // Number of microfacets in a cell
    // Alg. 3, line 5
  float n = pow(2.f, float(2 * l - (2 * (NLevels - 1))));
  n *= exp(LogMicrofacetDensity);

    // Corresponding continuous distribution LOD
    // Alg. 3, line 6
  float l_dist = log(n) / 1.38629f; // 2. * log(2) = 1.38629

    // Alg. 3, line 7
  float uDensityRandomisation = hashIQ(uint(rngSeed) * 2171U);

    // Fix density randomisation to 2 to have better appearance
    // Notation in the paper: \zeta
  float densityRandomisation = 2.f;

// Sample a Gaussian to randomise the distribution LOD around the distribution level l_dist
    // Alg. 3, line 8
  l_dist = sampleNormalDistribution(uDensityRandomisation, l_dist, densityRandomisation);

    // Alg. 3, line 9
  int l_disti = clamp(int(round(l_dist)), 0, NLevels);

    // Alg. 3, line 10
  if (l_disti == NLevels)
    return p22_beckmann_anisotrom_pic(slope_h.x, slope_h.y, Alpha_x, Alpha_y);

    // Alg. 3, line 13
  float uTheta = hashIQ(uint(rngSeed));
  float theta = 2.0f * m_pi * uTheta;

  // Uncomment to remove random distribution rotation
  // Lead to glint alignments
    // theta = 0.;

  float cosTheta = cos(theta);
  float sinTheta = sin(theta);

  vec2 scaleFactor = vec2(Alpha_x / Alpha, Alpha_y / Alpha);

    // Rotate and scale slope
    // Alg. 3, line 16
  slope_h = vec2(slope_h.x * cosTheta / scaleFactor.x + slope_h.y * sinTheta / scaleFactor.y, -slope_h.x * sinTheta / scaleFactor.x + slope_h.y * cosTheta / scaleFactor.y);

  vec2 abs_slope_h = vec2(abs(slope_h.x), abs(slope_h.y));

  int distPerChannel = N / 3;
  float alpha_dist_isqrt2_4 = Alpha * ISQRT2 * 4.f;

  if (abs_slope_h.x > alpha_dist_isqrt2_4 || abs_slope_h.y > alpha_dist_isqrt2_4)
    return 0.f;

  // Alg. 3, line 17
  float u1 = hashIQ(uint(rngSeed) * 16807U);
  float u2 = hashIQ(uint(rngSeed) * 48271U);

  // Alg. 3, line 18
  int i = int(u1 * float(N));
  int j = int(u2 * float(N));

  // 3 distributions values in one texel
  int distIdxXOver3 = i / 3;
  int distIdxYOver3 = j / 3;

  float texCoordX = abs_slope_h.x / alpha_dist_isqrt2_4;
  float texCoordY = abs_slope_h.y / alpha_dist_isqrt2_4;

  // vec3 P_i = textureLod(DictionaryTexture, vec3(texCoordX, 0.f, float(l_dist * N / 3 + distIdxXOver3)), 0.f).rgb;
  // vec3 P_j = textureLod(DictionaryTexture, vec3(texCoordY, 0, float(l_dist * N / 3 + distIdxYOver3)), 0).rgb;

  vec3 P_i = textureLod(DictionaryTexture, vec3(texCoordX, 0.f, float(int(l_dist) * N / 3 + distIdxXOver3)), 0.0f).rgb;
  vec3 P_j = textureLod(DictionaryTexture, vec3(texCoordY, 0.f, float(int(l_dist) * N / 3 + distIdxYOver3)), 0.0f).rgb;

  // Alg. 3, line 19
  // return P_i[int(mod(i, 3))] * P_j[int(mod(j, 3))] / (scaleFactor.x * scaleFactor.y);
  return P_i[i % 3] * P_j[j % 3] / (scaleFactor.x * scaleFactor.y);
}

//=========================================================================================================================
//========================================= Alg. 2, P-SDF for a discrete LOD ==============================================
//=========================================================================================================================

// Most of this function is similar to pbrt-v3 EWA function,
// which itself is similar to Heckbert 1889 algorithm, http://www.cs.cmu.edu/~ph/texfund/texfund.pdf, Section 3.5.9.
// Go through cells within the m_pixel footprint for a given LOD l

float P22xxP_(int l, vec2 slope_h, vec2 st, vec2 dst0, vec2 dst1) {

    // Convert surface coordinates to appropriate scale for level
  float pyrSize = float(pyramidSize(l));
  st[0] = st[0] * pyrSize - 0.5f;
  st[1] = st[1] * pyrSize - 0.5f;

  dst0 *= pyrSize;
  dst1 *= pyrSize;

  float A = dst0[1] * dst0[1] + dst1[1] * dst1[1] + 1.f;
  float B = -2.f * (dst0[0] * dst0[1] + dst1[0] * dst1[1]);
  float C = dst0[0] * dst0[0] + dst1[0] * dst1[0] + 1.f;
  float invF = 1.f / (A * C - B * B * 0.25f);
  A *= invF;
  B *= invF;
  C *= invF;

    // Compute the ellipse's bounding box in texture space
  float det = -B * B + 4.0f * A * C;
  float invDet = 1.0f / det;
  float uSqrt = sqrt(det * C);
  float vSqrt = sqrt(A * det);
  int s0 = int(ceil(st[0] - 2.f * invDet * uSqrt));
  int s1 = int(floor(st[0] + 2.f * invDet * uSqrt));
  int t0 = int(ceil(st[1] - 2.f * invDet * vSqrt));
  int t1 = int(floor(st[1] + 2.f * invDet * vSqrt));

    // Scan over ellipse bound and compute quadratic equation
  float sum = 0.f;
  float sumWts = 0.0f;
  int nbrOfIter = 0;
  for (int it = t0; it <= t1; ++it) {
    float tt = float(it) - st[1];
    for (int is = s0; is <= s1; ++is) {
      float ss = float(is) - st[0];
            // Compute squared radius and filter SDF if inside ellipse
      float r2 = A * ss * ss + B * ss * tt + C * tt * tt;
      if (r2 < 1.0f) {
                // Weighting function used in pbrt-v3 EWA function
        float alpha = 2.0f;
        float W_P = exp(-alpha * r2) - exp(-alpha);
                // Alg. 2, line 3
        // sum += Procedural_P22_theta_alpha(slope_h, l, is, it) * W_P;
        sum += P22_theta_alpha(slope_h, l, is, it) * W_P;
        sumWts += W_P;
      }
      nbrOfIter++;
            // Guardrail (Extremely rare case.)
      if (nbrOfIter > 100)
        break;
    }
        // Guardrail (Extremely rare case.)
    if (nbrOfIter > 100)
      break;
  }
  return sum / sumWts;
}

//=========================================================================================================================
//=============================== Evaluation of our procedural physically based glinty BRDF ===============================
//==================================================== Alg. 1, Eq. 14 =====================================================
//=========================================================================================================================
vec3 f_P(vec3 wo, vec3 wi, vec2 uv) {

  // if (wo.z <= 0.f)
  //   return vec3(0.f, 0.f, 0.f);
  // if (wi.z <= 0.f)
  //   return vec3(0.f, 0.f, 0.f);
    // Alg. 1, line 1
  vec3 wh = normalize(wo + wi);
  // if (wh.z <= 0.f)
  //   return vec3(0.f, 0.f, 0.f);

    // Local masking shadowing
  if (dot(wo, wh) <= 0.f || dot(wi, wh) <= 0.f)
    return vec3(0.f);

    // Eq. 1, Alg. 1, line 2
  vec2 slope_h = vec2(-wh.x / wh.z, -wh.y / wh.z);

  vec2 texCoord = TexCoord * uv;

  float D_P = 0.f;
  float P22_P = 0.f;

  // ------------------------------------------------------------------------------------------------------
  // Similar to pbrt-v3 MIPMap::Lookup function, http://www.pbr-book.org/3ed-2018/Texture/Image_Texture.html#EllipticallyWeightedAverage

  // Alg. 1, line 3
  vec2 dst0 = dFdx(texCoord);
  vec2 dst1 = dFdy(texCoord);

  // Compute ellipse minor and major axes
  if (dot(dst0, dst0) < dot(dst1, dst1)) {
    // Swap dst0 and dst1
    vec2 tmp = dst0;
    dst0 = dst1;
    dst1 = tmp;
  }

  float majorLength = length(dst0);
  float minorLength = length(dst1);

  // Clamp ellipse eccentricity if too large
  // Alg. 1, line 4
  if (minorLength * MaxAnisotropy < majorLength && minorLength > 0.f) {
    float scale = majorLength / (minorLength * MaxAnisotropy);
    dst1 *= scale;
    minorLength *= scale;
  }

  // ------------------------------------------------------------------------------------------------------
  // Without footprint, we evaluate the Cook Torrance BRDF
  if (minorLength == 0.0f) {
    D_P = ndf_beckmann_anisotrom_pic(wh, Alpha_x, Alpha_y);
  } else {
    // Choose LOD
    // Alg. 1, line 6
    float l = max(0.f, float(NLevels) - 1.f + log2(minorLength));
    int il = int(floor(l));

    // Alg. 1, line 7
    float w = l - float(il);

    // Alg. 1, line 8
    P22_P = mix(P22xxP_(il, slope_h, texCoord, dst0, dst1), P22xxP_(il + 1, slope_h, texCoord, dst0, dst1), w);

    // Eq. 6, Alg. 1, line 10
    D_P = P22_P / (wh.z * wh.z * wh.z * wh.z);
  }

  // V-cavity masking shadowing
  float G1wowh = min(1.f, 2.f * wh.z * wo.z / dot(wo, wh));
  float G1wiwh = min(1.f, 2.f * wh.z * wi.z / dot(wi, wh));
  float G = G1wowh * G1wiwh;

  // Fresnel is set to one for simplicity here
  // but feel free to use "real" Fresnel term
  vec3 F = vec3(1.f, 1.f, 1.f);

  // Eq. 14, Alg. 1, line 14
  // (wi dot wg) is cancelled by
  // the cosine weight in the rendering equation
  return (F * G * D_P) / (4.f * wo.z);
}