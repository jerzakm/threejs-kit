<script lang="ts">
	import { T, useFrame, useThrelte } from '@threlte/core';
	import { OrbitControls, Sky } from '@threlte/extras';

	import ParallaxTest from './ParallaxMaterial.svelte';
	import { DEG2RAD } from 'three/src/math/MathUtils';
	import Terrain from '$lib/components/Terrain.svelte';

	const { camera, renderer } = useThrelte();

	$: renderer.toneMappingExposure = 0.7;

	useFrame(({ clock }) => {
		$camera.updateWorldMatrix(false, false);
	});
</script>

<Sky
	turbidity={10}
	setEnvironment
	azimuth={20}
	elevation={10}
	mieCoefficient={0.03}
	mieDirectionalG={0.66}
/>

<!-- <T.PerspectiveCamera makeDefault position={[30, 35, 18]} fov={20}> -->
<T.PerspectiveCamera makeDefault position={[200, 80, 200]} fov={20}>
	<OrbitControls
		enableDamping
		target.x={0}
		target.y={2.5}
		target.z={0}
		autoRotate={false}
		autoRotateSpeed={0.1}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight position={[90, 80, 300]} intensity={1.0} castShadow>
	<T.Mesh>
		<T.SphereGeometry args={[1, 5, 5]} />
		<T.MeshBasicMaterial wireframe color="yellow" />
	</T.Mesh>
</T.DirectionalLight>

<T.AmbientLight intensity={0.5} />

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

<T.Mesh position.x={0} position.z={-50}>
	<T.BoxGeometry
		args={[45, 45, 45]}
		on:create={({ ref }) => {
			// ref.computeVertexNormals();
			// ref.computeTangents();
		}}
	/>
	<ParallaxTest repeat={2} />
</T.Mesh>

<T.Mesh position.x={40} position.y={40} rotation.y={DEG2RAD * 0}>
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

<Terrain amplitude={3}>
	<ParallaxTest repeat={45} />
</Terrain>
