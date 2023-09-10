<script lang="ts">
	// import { MeshGlintMaterial } from '$lib/material/GlintMaterial2';
	import { T, useFrame, useThrelte } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';

	import ParallaxTest from '../parallax/ParallaxMaterial.svelte';

	// let lightPosition = new Vector3();
	// let time = 0;

	// const normalMap3 = new THREE.CanvasTexture(new FlakesTexture());
	// normalMap3.wrapS = THREE.RepeatWrapping;
	// normalMap3.wrapT = THREE.RepeatWrapping;
	// normalMap3.repeat.x = 20;
	// normalMap3.repeat.y = 16;
	// normalMap3.anisotropy = 16;

	// const { dictionaryTexture } = loadGlintDictionaryQuality();

	// const material = new MeshGlintMaterial({
	// 	// color: '#ffa077',
	// 	// color: '#ff7822',
	// 	color: '#eeeeff',
	// 	roughness: 0.99,
	// 	metalness: 0.4,
	// 	dictionaryTexture
	// });

	// const sandAlbedo = useTexture('/sand/xd0mda1_2K_Albedo.jpg');
	// const sandNormal = useTexture('/sand/xd0mda1_2K_Normal.jpg');
	// const sandDisplacement = useTexture('/sand/xd0mda1_2K_Displacement.jpg');

	// $: {
	// 	if ($sandAlbedo && $sandNormal && $sandDisplacement) {
	// 		$sandAlbedo.wrapS = THREE.RepeatWrapping;
	// 		$sandAlbedo.wrapT = THREE.RepeatWrapping;
	// 		$sandAlbedo.repeat.x = 8;
	// 		$sandAlbedo.repeat.y = 8;
	// 		$sandAlbedo.needsUpdate = true;
	// 		// $sandAlbedo.anisotropy = 1;
	// 		// material.map = $sandAlbedo;

	// 		$sandNormal.wrapS = THREE.RepeatWrapping;
	// 		$sandNormal.wrapT = THREE.RepeatWrapping;
	// 		$sandNormal.repeat.x = 4;
	// 		$sandNormal.repeat.y = 4;
	// 		$sandNormal.needsUpdate = true;
	// 		// $sandAlbedo.anisotropy = 1;
	// 		material.normalMap = $sandNormal;
	// 		material.normalScale = new THREE.Vector2(1, 1);
	// 	}
	// }

	// const material2 = new MeshGlintMaterial({
	// 	color: '#446699',
	// 	clearcoat: 1.0,
	// 	clearcoatRoughness: 0.1,
	// 	metalness: 0.9,
	// 	roughness: 0.5,
	// 	normalMap: normalMap3,
	// 	normalScale: new THREE.Vector2(0.1, 0.1),
	// 	dictionaryTexture
	// });

	// const material3 = new MeshGlintMaterial({
	// 	color: '#121212',
	// 	metalness: 0.0,
	// 	roughness: 0.8,
	// 	dictionaryTexture
	// });

	// const intensity = 4600;
	// material.alphaX = 0.99;
	// material.alphaY = 0.99;
	// material.microfacetRelativeArea = 1;
	// material.glintAlpha = 0.8;
	// material.logMicrofacetDensity = 22;
	// material.lightIntensity = new Vector3(intensity, intensity, intensity);

	// material2.alphaX = 0.9;
	// material2.alphaY = 0.9;
	// material2.microfacetRelativeArea = 0.85;
	// material2.glintAlpha = 0.7;
	// material2.logMicrofacetDensity = 17;
	// material2.lightIntensity = new Vector3(intensity * 2, intensity * 2, intensity * 2);

	// material3.alphaX = 0.9;
	// material3.alphaY = 0.9;
	// material3.microfacetRelativeArea = 0.1;
	// material3.glintAlpha = 0.5;
	// material3.logMicrofacetDensity = 20;
	// material3.lightIntensity = new Vector3(intensity, intensity, intensity);

	const { camera, renderer } = useThrelte();

	$: renderer.toneMappingExposure = 0.7;

	useFrame(({ clock }) => {
		// time = clock.getElapsedTime();
		// if (light) {
		// 	// light.getWorldPosition(lightPosition);
		// 	// material.lightPosition = lightPosition;
		// 	// material.cameraPosition = $camera.position;
		// 	// material.needsUpdate = true;
		// 	// material3.lightPosition = lightPosition;
		// 	// material3.cameraPosition = $camera.position;
		// 	// material3.needsUpdate = true;
		// 	// material2.lightPosition = lightPosition;
		// 	// material2.cameraPosition = $camera.position;
		// 	// material2.needsUpdate = true;
		// }
		// // lightPosition = lightPosition;
	});

	let glintOffset = 0;
</script>

<ParallaxTest />

<!-- <Sky
	turbidity={10}
	setEnvironment
	azimuth={20}
	elevation={10}
	mieCoefficient={0.03}
	mieDirectionalG={0.66}
/> -->

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

<T.DirectionalLight position={[90, 80, 300]} intensity={1.0} castShadow>
	<T.Mesh>
		<T.SphereGeometry args={[1, 5, 5]} />
		<T.MeshBasicMaterial wireframe color="yellow" />
	</T.Mesh>
</T.DirectionalLight>

<T.AmbientLight intensity={0.5} />

<!-- <T.Mesh position.x={5} position.y={15}>
	<T.SphereGeometry
		args={[4]}
		on:create={({ ref }) => {
			ref.computeVertexNormals();
			ref.computeTangents();
		}}
	/>
	<T is={material2} />
</T.Mesh> -->

<!-- <Car scale={0.1} position.x={1} position.z={-10} rotation.y={DEG2RAD * 30} position.y={5}>
	<T is={material2} />
</Car> -->

<!-- <Terrain>
	<T is={material} />
</Terrain> -->

<!-- Control group -->

<!-- <T.Group position.z={4} position.x={12} position.y={3}>
	<T.Mesh position={[4.9, 1.5, 0.75]}>
		<T.SphereGeometry args={[3]} />
		<T.MeshStandardMaterial color="#F85122" roughness={0.2} metalness={0.2} />
	</T.Mesh>
</T.Group> -->
