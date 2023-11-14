<script lang="ts">
	import { T } from '@threlte/core';
	import { Grid, OrbitControls, Sky } from '@threlte/extras';
	import PlayerUpdater from './PlayerUpdater.svelte';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';
	import AnimatedInstancedSprite from './AnimatedInstancedSprite.svelte';

	const count = 50000;
</script>

<T.PerspectiveCamera makeDefault position.z={15} position.y={7}>
	<OrbitControls />
</T.PerspectiveCamera>

<slot />

<AnimatedInstancedSprite
	textureUrl="/textures/sprites/player.png"
	dataUrl="/textures/sprites/player.json"
	fps={10}
	loop={true}
	{count}
>
	<PlayerUpdater />
</AnimatedInstancedSprite>

<Sky elevation={0.15} />
<!-- <T.AmbientLight /> -->

<T.Mesh rotation.x={-DEG2RAD * 90} receiveShadow>
	<T.PlaneGeometry args={[1000, 100]} />
	<T.MeshStandardMaterial color={'#aa6644'} />
</T.Mesh>

<Grid infiniteGrid type={'grid'} sectionThickness={0.0} position.y={0.01} />
