<script lang="ts">
	import { T, useFrame, useThrelte, extend } from '@threlte/core';
	import { OrbitControls, Sky, useTexture } from '@threlte/extras';

	import { MeshParallaxMaterial } from '@threejs-kit/materials';

	import ParallaxTest from './ParallaxMaterial.svelte';
	import { DEG2RAD } from 'three/src/math/MathUtils';
	import Terrain from '$lib/components/Terrain.svelte';
	import {
		AmbientLight,
		LinearFilter,
		NearestFilter,
		NearestMipMapLinearFilter,
		NearestMipMapNearestFilter,
		RepeatWrapping,
		Vector2
	} from 'three';

	extend({ MeshParallaxMaterial });

	const { camera, renderer } = useThrelte();

	let terrainRepeat = 25;

	$: renderer.toneMappingExposure = 0.7;

	const bump = useTexture('/red_rock/bump.jpg');
	const diffuse = useTexture('/red_rock/albedo.jpg');
	const normal = useTexture('/red_rock/normal.jpg');

	let terrainMaterial: any;

	$: {
		if ($diffuse && $bump && $normal && terrainMaterial) {
			$diffuse.wrapS = RepeatWrapping;
			$diffuse.wrapT = RepeatWrapping;
			$diffuse.repeat.x = terrainRepeat;
			$diffuse.repeat.y = terrainRepeat;
			$diffuse.needsUpdate = true;

			$bump.wrapS = RepeatWrapping;
			$bump.wrapT = RepeatWrapping;
			$bump.repeat.x = terrainRepeat;
			$bump.repeat.y = terrainRepeat;
			$bump.needsUpdate = true;

			$normal.wrapS = RepeatWrapping;
			$normal.wrapT = RepeatWrapping;
			$normal.repeat.x = terrainRepeat;
			$normal.repeat.y = terrainRepeat;
			$normal.needsUpdate = true;

			terrainMaterial.normalMap = $normal;

			terrainMaterial.needsUpdate = true;
		}
	}

	$: console.log(terrainMaterial);

	useFrame(({ clock }) => {
		$camera.updateWorldMatrix(false, false);
	});
</script>

<Sky
	turbidity={0}
	setEnvironment
	azimuth={20}
	elevation={3}
	mieCoefficient={0.1}
	mieDirectionalG={0.91}
/>

<!-- <T.PerspectiveCamera makeDefault position={[30, 35, 18]} fov={20}> -->
<T.PerspectiveCamera makeDefault position={[30, 5, -50]} fov={20}>
	<OrbitControls
		enableDamping
		target.x={0}
		target.y={0.5}
		target.z={20}
		autoRotate={false}
		autoRotateSpeed={0.1}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight position={[90, 80, 300]} intensity={4.5} castShadow color="#ffeecc">
	<T.Mesh>
		<T.SphereGeometry args={[1, 5, 5]} />
		<T.MeshBasicMaterial wireframe color="yellow" />
	</T.Mesh>
</T.DirectionalLight>
<!-- <T.AmbientLight intensity={0.25} /> -->

<T.Mesh position.x={0} position.y={5}>
	<T.BoxGeometry
		args={[15, 15, 15]}
		on:create={({ ref }) => {
			// ref.computeVertexNormals();
			// ref.computeTangents();
		}}
	/>
	<ParallaxTest />
</T.Mesh>

<T.Mesh position.x={0} position.y={5}>
	<T.BoxGeometry
		args={[15, 15, 15]}
		on:create={({ ref }) => {
			// ref.computeVertexNormals();
			// ref.computeTangents();
		}}
	/>
	<T.MeshBasicMaterial wireframe color="red" />
</T.Mesh>

<T.Mesh position.x={40} position.y={0} rotation.y={DEG2RAD * 0}>
	<T.PlaneGeometry
		args={[40, 40]}
		on:create={({ ref }) => {
			// ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<ParallaxTest />
</T.Mesh>

<T.Mesh position.x={3} position.y={0} position.z={22}>
	<T.SphereGeometry
		args={[5]}
		on:create={({ ref }) => {
			// ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<ParallaxTest />
</T.Mesh>

<Terrain amplitude={1}>
	<T.MeshParallaxMaterial
		bind:ref={terrainMaterial}
		args={[{}, { debugQualityMask: false }]}
		map={$diffuse}
		parallaxOcclusionMap={$bump}
		normalMap={$normal}
		normalScale.x={1}
		normalScale.y={1}
		parallaxScale={0.1}
		cutoffDistance={500}
		repeatUv.x={terrainRepeat}
		repeatUv.y={terrainRepeat}
		parallaxMinLayers={16}
		parallaxMaxLayers={128}
	/>
</Terrain>
