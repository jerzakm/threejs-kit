<script lang="ts">
	import Terrain from '$lib/components/Terrain.svelte';

	import { MeshGlintMaterial, loadGlintDictionaryQuality } from '@threejs-kit/materials';
	import { T, useFrame, useThrelte } from '@threlte/core';
	import { OrbitControls, Sky, useTexture } from '@threlte/extras';
	import Car from './Car.svelte';
	import { Vector3 } from 'three';
	import { DEG2RAD } from 'three/src/math/MathUtils';
	import * as THREE from 'three';

	let lightPosition = new Vector3();
	let time = 0;

	// const normalMap3 = new THREE.CanvasTexture(new FlakesTexture());
	// normalMap3.wrapS = THREE.RepeatWrapping;
	// normalMap3.wrapT = THREE.RepeatWrapping;
	// normalMap3.repeat.x = 20;
	// normalMap3.repeat.y = 16;
	// normalMap3.anisotropy = 16;

	const { dictionaryTexture } = loadGlintDictionaryQuality();

	const material = new MeshGlintMaterial({
		// color: '#ffa077',
		// color: '#ff7822',
		// color: '#eeeeff',
		color: '#aa33cc',
		roughness: 0.99,
		metalness: 0.3,
		dictionaryTexture,
		envMapIntensity: 0
	});

	const sandAlbedo = useTexture('/sand/xd0mda1_2K_Albedo.jpg');
	const sandNormal = useTexture('/sand/xd0mda1_2K_Normal.jpg');
	const sandDisplacement = useTexture('/sand/xd0mda1_2K_Displacement.jpg');

	$: {
		if ($sandAlbedo && $sandNormal && $sandDisplacement) {
			$sandAlbedo.wrapS = THREE.RepeatWrapping;
			$sandAlbedo.wrapT = THREE.RepeatWrapping;
			$sandAlbedo.repeat.x = 12;
			$sandAlbedo.repeat.y = 8;
			$sandAlbedo.needsUpdate = true;
			// $sandAlbedo.anisotropy = 1;
			// material.map = $sandAlbedo;

			$sandNormal.wrapS = THREE.RepeatWrapping;
			$sandNormal.wrapT = THREE.RepeatWrapping;
			$sandNormal.repeat.x = 4;
			$sandNormal.repeat.y = 4;
			$sandNormal.needsUpdate = true;
			// $sandAlbedo.anisotropy = 1;
			material.normalMap = $sandNormal;
			material.normalScale = new THREE.Vector2(0.1, 0.1);
		}
	}

	const material2 = new MeshGlintMaterial({
		// color: '#446699',
		color: '#ff2922',
		clearcoat: 1.0,
		clearcoatRoughness: 0.0,
		metalness: 0.5,
		roughness: 0.0,
		// normalMap: normalMap3,
		normalScale: new THREE.Vector2(0.1, 0.1),
		dictionaryTexture
	});

	const material3 = new MeshGlintMaterial({
		color: '#121212',
		metalness: 0.0,
		roughness: 0.8,
		dictionaryTexture
	});

	const intensity = 8600;
	material.alphaX = 0.99;
	material.alphaY = 0.99;
	material.microfacetRelativeArea = 1;
	material.glintAlpha = 0.99;
	material.logMicrofacetDensity = 24;
	material.lightIntensity = new Vector3(intensity, intensity, intensity);

	material2.alphaX = 0.99;
	material2.alphaY = 0.99;
	material2.microfacetRelativeArea = 1;
	material2.glintAlpha = 0.99;
	material2.logMicrofacetDensity = 21;
	material2.lightIntensity = new Vector3(intensity, intensity, intensity);

	material3.alphaX = 0.9;
	material3.alphaY = 0.9;
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
			material.cameraPosition = $camera.position;
			material.needsUpdate = true;
			material3.lightPosition = lightPosition;
			material3.cameraPosition = $camera.position;
			material3.needsUpdate = true;
			material2.lightPosition = lightPosition;
			material2.cameraPosition = $camera.position;
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

<T.PerspectiveCamera makeDefault position={[30 + glintOffset, 25, -50]} fov={15}>
	<OrbitControls
		enableDamping
		target.x={0 + glintOffset}
		target.y={2.5}
		target.z={0}
		autoRotate={false}
		autoRotateSpeed={0.1}
	/>
</T.PerspectiveCamera>

<!-- position.x={Math.sin(time * 0.1) * 25 + glintOffset}
	position.y={2}
	position.z={-Math.cos(time * 0.1) * 25} -->

<T.DirectionalLight position={[90, 80, 300]} intensity={1.0} castShadow bind:ref={light}>
	<T.Mesh>
		<T.SphereGeometry args={[1, 5, 5]} />
		<T.MeshBasicMaterial wireframe color="yellow" />
	</T.Mesh>
</T.DirectionalLight>

<T.AmbientLight intensity={0.5} />

<T.Mesh position.x={0} position.y={1} rotation.x={DEG2RAD * 90} rotation.y={DEG2RAD * -90}>
	<T.TorusGeometry
		args={[4, 2, 128]}
		on:create={({ ref }) => {
			ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<T is={material2} />
</T.Mesh>

<!-- <Car scale={0.1} position.x={1} position.z={-10} rotation.y={DEG2RAD * 30} position.y={5}>
	<T is={material2} />
</Car> -->

<Terrain seed="test" amplitude={3}>
	<T is={material} />
</Terrain>

<!-- Control group -->

<!-- <T.Group position.z={4} position.x={12} position.y={3}>
	<T.Mesh position={[4.9, 1.5, 0.75]}>
		<T.SphereGeometry args={[3]} />
		<T.MeshStandardMaterial color="#F85122" roughness={0.2} metalness={0.2} />
	</T.Mesh>
</T.Group> -->
