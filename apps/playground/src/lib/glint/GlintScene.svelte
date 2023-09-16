<script lang="ts">
	import Terrain from '$lib/components/Terrain.svelte';

	import { MeshGlintMaterial, loadDefaultGlintDictionary } from '@threejs-kit/materials';
	import { T, useFrame, useThrelte } from '@threlte/core';
	import { OrbitControls, Sky } from '@threlte/extras';
	import * as THREE from 'three';
	import { Vector3 } from 'three';
	import { DEG2RAD } from 'three/src/math/MathUtils';

	let lightPosition = new Vector3();
	let time = 0;

	const { dictionaryTexture } = loadDefaultGlintDictionary();

	const material = new MeshGlintMaterial(
		{
			color: '#aa33cc',
			roughness: 0.99,
			metalness: 0.3,

			envMapIntensity: 0
		},
		{
			dictionaryTexture
		}
	);

	const material2 = new MeshGlintMaterial(
		{
			color: '#ff7044',
			clearcoat: 1.0,
			clearcoatRoughness: 0.0,
			metalness: 0.4,
			roughness: 0.1,
			normalScale: new THREE.Vector2(0.1, 0.1)
		},
		{
			dictionaryTexture
		}
	);

	const material3 = new MeshGlintMaterial(
		{
			color: '#121212',
			metalness: 0.0,
			roughness: 0.8
		},
		{
			dictionaryTexture
		}
	);

	const intensity = 1;
	material.roughnessX = 0.99;
	material.roughnessY = 0.99;
	material.microfacetRelativeArea = 1;
	material.glintAlpha = 0.9;
	material.logMicrofacetDensity = 23;
	material.lightIntensity = new Vector3(intensity, intensity, intensity);

	material2.roughnessX = 0.99;
	material2.roughnessY = 0.99;
	material2.microfacetRelativeArea = 0.04;
	material2.glintAlpha = 0.99;
	material2.logMicrofacetDensity = 10;
	material2.lightIntensity = new Vector3(intensity, intensity, intensity);

	material3.roughnessX = 0.9;
	material3.roughnessY = 0.9;
	material3.microfacetRelativeArea = 0.1;
	material3.glintAlpha = 0.5;
	material3.logMicrofacetDensity = 20;
	material3.lightIntensity = new Vector3(intensity, intensity, intensity);

	const { camera, renderer } = useThrelte();

	let light: any;

	$: renderer.toneMappingExposure = 0.7;

	useFrame(({ clock }) => {
		time = clock.getElapsedTime();
		if (light) {
			light.getWorldPosition(lightPosition);
			material.lightPosition = lightPosition;
			material.needsUpdate = true;
			material3.lightPosition = lightPosition;
			material3.needsUpdate = true;
			material2.lightPosition = lightPosition;
			material2.needsUpdate = true;
		}
		lightPosition = lightPosition;
	});

	let glintOffset = 0;
</script>

<Sky
	turbidity={10}
	setEnvironment
	azimuth={20}
	elevation={2}
	mieCoefficient={0.1}
	mieDirectionalG={0.66}
/>

<T.PerspectiveCamera makeDefault position={[-70 + glintOffset, 15, 10]} fov={15}>
	<OrbitControls
		enableDamping
		target.x={0 + glintOffset}
		target.y={2.5}
		target.z={0}
		autoRotate={true}
		autoRotateSpeed={0.5}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight position={[90, 80, 300]} intensity={0.25} castShadow bind:ref={light} />

<T.AmbientLight intensity={0.5} />

<T.Mesh position.x={0} position.y={2} rotation.x={DEG2RAD * 90} rotation.y={DEG2RAD * -90}>
	<T.TorusGeometry
		args={[4, 2, 128]}
		on:create={({ ref }) => {
			ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<T is={material2} />
</T.Mesh>

<T.Mesh position.x={-10} position.y={2} rotation.x={DEG2RAD * 90} rotation.y={DEG2RAD * 90}>
	<T.SphereGeometry
		args={[3, 36, 36]}
		on:create={({ ref }) => {
			ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<T is={material2} />
</T.Mesh>

<Terrain seed="test" amplitude={3}>
	<T is={material} />
</Terrain>
