import { buildTriangleBvh, gemstoneIors } from "./gem-ray-kernel.js?v=20260911-construction-v32";

const installations = new WeakMap();
const shaderFunctions = `
uniform sampler2D gemBvh;
uniform sampler2D gemTriangles;
uniform mat4 gemWorldToLocal;
uniform mat3 gemNormalToWorld;
uniform mat3 gemLocalToWorld;
uniform mat3 gemLocalToPhysical;
uniform vec4 gemInclusions[32];
uniform float gemInclusionOpacity[32];
uniform int gemInclusionCount;
uniform vec3 gemIors;
uniform float gemEpsilon;
uniform int gemBounces;
varying vec3 gemLocalPosition;
varying vec3 gemLocalNormal;
vec4 gemFetch(sampler2D buffer, int index) {
  return texelFetch(buffer, ivec2(index % 256, index / 256), 0);
}
bool gemBox(vec3 origin, vec3 direction, vec3 minimum, vec3 maximum, float nearest) {
  float nearDistance = gemEpsilon;
  float farDistance = nearest;
  for (int axis = 0; axis < 3; axis++) {
    if (abs(direction[axis]) < 1e-12) {
      if (origin[axis] < minimum[axis] || origin[axis] > maximum[axis]) return false;
    } else {
      float first = (minimum[axis] - origin[axis]) / direction[axis];
      float second = (maximum[axis] - origin[axis]) / direction[axis];
      nearDistance = max(nearDistance, min(first, second));
      farDistance = min(farDistance, max(first, second));
      if (farDistance < nearDistance) return false;
    }
  }
  return true;
}
bool gemIntersect(vec3 origin, vec3 direction, out float nearest, out vec3 hitNormal) {
  int stack[32];
  int size = 1;
  stack[0] = 0;
  nearest = 1e20;
  bool found = false;
  for (int visit = 0; visit < 512; visit++) {
    if (size == 0) break;
    int node = stack[--size];
    vec4 lower = gemFetch(gemBvh, node * 2);
    vec4 upper = gemFetch(gemBvh, node * 2 + 1);
    if (!gemBox(origin, direction, lower.xyz, upper.xyz, nearest)) continue;
    if (lower.w >= 0.0) {
      if (size > 29) return false;
      stack[size++] = int(lower.w);
      stack[size++] = int(upper.w);
    } else {
      int start = int(-lower.w - 1.0);
      int count = int(upper.w);
      for (int corner = 0; corner < 4; corner++) {
        if (corner >= count) break;
        int triangle = (start + corner) * 3;
        vec3 vertex = gemFetch(gemTriangles, triangle).xyz;
        vec3 edgeFirst = gemFetch(gemTriangles, triangle + 1).xyz;
        vec3 edgeSecond = gemFetch(gemTriangles, triangle + 2).xyz;
        vec3 determinantVector = cross(direction, edgeSecond);
        float determinant = dot(edgeFirst, determinantVector);
        if (abs(determinant) < 1e-12) continue;
        vec3 relative = origin - vertex;
        float firstWeight = dot(relative, determinantVector) / determinant;
        vec3 crossRelative = cross(relative, edgeFirst);
        float secondWeight = dot(direction, crossRelative) / determinant;
        float distance = dot(edgeSecond, crossRelative) / determinant;
        if (firstWeight < -1e-5 || secondWeight < -1e-5 || firstWeight + secondWeight > 1.00001 || distance <= gemEpsilon || distance >= nearest) continue;
        nearest = distance;
        hitNormal = normalize(cross(edgeFirst, edgeSecond));
        found = true;
      }
    }
  }
  return found;
}
float gemFresnel(float cosine, float relativeIor) {
  float incidence = clamp(abs(cosine), 0.0, 1.0);
  float sinSquared = relativeIor * relativeIor * (1.0 - incidence * incidence);
  if (sinSquared >= 1.0) return 1.0;
  float transmitted = sqrt(1.0 - sinSquared);
  float parallel = (relativeIor * incidence - transmitted) / (relativeIor * incidence + transmitted);
  float perpendicular = (incidence - relativeIor * transmitted) / (incidence + relativeIor * transmitted);
  return clamp(0.5 * (parallel * parallel + perpendicular * perpendicular), 0.0, 1.0);
}
vec3 gemEnvironment(vec3 direction, float roughness) {
  #ifdef ENVMAP_TYPE_CUBE_UV
    return textureCubeUV(envMap, envMapRotation * normalize(direction), roughness).rgb * envMapIntensity;
  #else
    return vec3(0.0);
  #endif
}
float gemInclusionTransmission(vec3 origin, vec3 direction, float segmentLength) {
  float visibility = 1.0;
  for (int index = 0; index < 32; index++) {
    if (index >= gemInclusionCount) break;
    vec3 relative = origin - gemInclusions[index].xyz;
    float projection = dot(relative, direction);
    float discriminant = projection * projection - dot(relative, relative) + gemInclusions[index].w * gemInclusions[index].w;
    if (discriminant <= 0.0) continue;
    float halfChord = sqrt(discriminant);
    float entry = max(0.0, -projection - halfChord);
    float exitDistance = min(segmentLength, -projection + halfChord);
    if (exitDistance > entry) visibility *= 1.0 - gemInclusionOpacity[index];
  }
  return visibility;
}
vec3 gemTransport(float indexOfRefraction, vec3 incidentWorld, vec3 normalWorld, float roughness, vec3 absorption, float absorptionDistance) {
  float entryReflection = gemFresnel(-dot(incidentWorld, normalWorld), 1.0 / indexOfRefraction);
  vec3 directionWorld = refract(incidentWorld, normalWorld, 1.0 / indexOfRefraction);
  vec3 direction = normalize((gemWorldToLocal * vec4(directionWorld, 0.0)).xyz);
  vec3 origin = gemLocalPosition + direction * gemEpsilon * 4.0;
  vec3 throughput = vec3(1.0 - entryReflection);
  vec3 radiance = vec3(0.0);
  for (int bounce = 0; bounce < 20; bounce++) {
    if (bounce >= gemBounces) break;
    float distance;
    vec3 localNormal;
    if (!gemIntersect(origin, direction, distance, localNormal)) break;
    vec3 point = origin + distance * direction;
    vec3 surfaceNormal = normalize(gemNormalToWorld * localNormal);
    float worldDistance = length(gemLocalToPhysical * (distance * direction));
    if (!isinf(absorptionDistance)) throughput *= pow(clamp(absorption, vec3(1e-6), vec3(1.0)), vec3(worldDistance / max(absorptionDistance, 1e-6)));
    throughput *= gemInclusionTransmission(origin, direction, distance);
    vec3 outward = refract(directionWorld, -surfaceNormal, indexOfRefraction);
    float reflectance = gemFresnel(dot(directionWorld, surfaceNormal), indexOfRefraction);
    if (dot(outward, outward) > 0.01) radiance += throughput * (1.0 - reflectance) * gemEnvironment(outward, roughness);
    throughput *= reflectance;
    if (max(max(throughput.r, throughput.g), throughput.b) < 1e-4) break;
    directionWorld = normalize(reflect(directionWorld, surfaceNormal));
    direction = normalize((gemWorldToLocal * vec4(directionWorld, 0.0)).xyz);
    origin = point + direction * gemEpsilon * 4.0;
  }
  return radiance;
}
`;

const transmissionShader = `
#ifdef USE_TRANSMISSION
  material.transmission = transmission;
  material.transmissionAlpha = 1.0;
  vec3 incidentWorld = normalize(vWorldPosition - cameraPosition);
  vec3 normalWorld = normalize(gemNormalToWorld * gemLocalNormal);
  vec3 traced;
  if (abs(gemIors.z - gemIors.x) < 0.00001) {
    traced = gemTransport(gemIors.y, incidentWorld, normalWorld, material.roughness, attenuationColor, attenuationDistance);
  } else {
    traced.r = gemTransport(gemIors.x, incidentWorld, normalWorld, material.roughness, attenuationColor, attenuationDistance).r;
    traced.g = gemTransport(gemIors.y, incidentWorld, normalWorld, material.roughness, attenuationColor, attenuationDistance).g;
    traced.b = gemTransport(gemIors.z, incidentWorld, normalWorld, material.roughness, attenuationColor, attenuationDistance).b;
  }
  totalDiffuse = mix(totalDiffuse, traced * material.diffuseColor, material.transmission);
#endif
`;

export function installGemRayMaterial(THREE, mesh, { dispersion = 0.044, strength = 1, bounces = 12, physicalMatrix } = {}) {
  if (!mesh.isMesh || !mesh.material?.isMeshPhysicalMaterial || mesh.material.transmission <= 0) return false;
  const geometry = mesh.geometry;
  const bvh = buildTriangleBvh(geometry.attributes.position.array, geometry.index?.array);
  if (bvh.maximumDepth >= 30 || bvh.nodes.length > 511) return false;
  const texture = (packed) => {
    const height = Math.max(1, Math.ceil(packed.length / 1024));
    const data = new Float32Array(1024 * height);
    data.set(packed);
    const result = new THREE.DataTexture(data, 256, height, THREE.RGBAFormat, THREE.FloatType);
    result.needsUpdate = true;
    return result;
  };
  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const originalMaterial = mesh.material;
  mesh.updateWorldMatrix(true, false);
  const material = originalMaterial.clone();
  const inclusions = mesh.children.filter((child) => child.userData.isInclusion).slice(0, 32);
  const inclusionSpheres = Array.from({ length: 32 }, () => new THREE.Vector4());
  const inclusionOpacity = new Float32Array(32);
  for (const [index, inclusion] of inclusions.entries()) {
    inclusion.geometry.computeBoundingSphere();
    inclusion.updateMatrix();
    const sphere = inclusion.geometry.boundingSphere.clone().applyMatrix4(inclusion.matrix);
    inclusionSpheres[index].set(sphere.center.x, sphere.center.y, sphere.center.z, sphere.radius);
    inclusionOpacity[index] = Math.min(0.98, inclusion.material.opacity);
    inclusion.visible = false;
  }
  const uniforms = {
    gemBvh: { value: texture(bvh.packedNodes) }, gemTriangles: { value: texture(bvh.packedTriangles) },
    gemWorldToLocal: { value: new THREE.Matrix4() }, gemNormalToWorld: { value: new THREE.Matrix3() },
    gemLocalToWorld: { value: new THREE.Matrix3() },
    gemLocalToPhysical: { value: new THREE.Matrix3().setFromMatrix4(physicalMatrix || mesh.matrixWorld) },
    gemInclusions: { value: inclusionSpheres }, gemInclusionOpacity: { value: inclusionOpacity }, gemInclusionCount: { value: inclusions.length },
    gemIors: { value: new THREE.Vector3(...gemstoneIors(material.ior, dispersion, strength)) },
    gemEpsilon: { value: Math.max(size.x, size.y, size.z) * 1e-5 },
    gemBounces: { value: Math.max(1, Math.min(20, Math.round(bounces))) }
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `varying vec3 gemLocalPosition;\nvarying vec3 gemLocalNormal;\n${shader.vertexShader}`
      .replace("#include <begin_vertex>", "#include <begin_vertex>\ngemLocalPosition = position;\ngemLocalNormal = normal;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <transmission_pars_fragment>", `#include <transmission_pars_fragment>\n${shaderFunctions}`)
      .replace("#include <transmission_fragment>", transmissionShader);
  };
  material.customProgramCacheKey = () => "tjc-gem-bvh-rgb-v3.2";
  const originalBeforeRender = mesh.onBeforeRender;
  mesh.onBeforeRender = function (...args) {
    originalBeforeRender.apply(this, args);
    uniforms.gemWorldToLocal.value.copy(this.matrixWorld).invert();
    uniforms.gemNormalToWorld.value.getNormalMatrix(this.matrixWorld);
    uniforms.gemLocalToWorld.value.setFromMatrix4(this.matrixWorld);
  };
  mesh.material = material;
  mesh.userData.optics = { engine: "triangle-bvh-rgb.v3.1", bounces: uniforms.gemBounces.value, iors: uniforms.gemIors.value.toArray(), triangles: bvh.triangles.length, inclusionSpheres: inclusions.length, scope: "gem-internal transport with environment exits and approximate inclusion occlusion" };
  installations.set(mesh, { uniforms, originalBeforeRender, inclusions });
  return originalMaterial;
}

export function setGemRayBounces(mesh, bounces) {
  const entry = installations.get(mesh);
  if (entry) entry.uniforms.gemBounces.value = Math.max(1, Math.min(20, Math.round(bounces)));
}

export function disposeGemRayMaterial(mesh) {
  const entry = installations.get(mesh);
  if (!entry) return;
  entry.uniforms.gemBvh.value.dispose();
  entry.uniforms.gemTriangles.value.dispose();
  entry.inclusions.forEach((inclusion) => { inclusion.visible = true; });
  mesh.onBeforeRender = entry.originalBeforeRender;
  installations.delete(mesh);
}
