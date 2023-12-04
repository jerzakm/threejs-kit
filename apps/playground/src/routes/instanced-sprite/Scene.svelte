<script lang="ts">
	import { T } from '@threlte/core';
	import { Grid, OrbitControls, Sky } from '@threlte/extras';
	import PlayerUpdater from './PlayerUpdater.svelte';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';
	import AnimatedInstancedSprite from './AnimatedInstancedSprite.svelte';
	import FlyerUpdater from './FlyerUpdater.svelte';
	import { createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';

	const count = 20;

	const spritesheet = createSpritesheet()
		.add('fly', '/textures/sprites/Monsters_Creatures_Fantasy/Flying_eye/Flight.png', {
			type: 'frameSize',
			w: 150,
			h: 150
		})
		.add('attack', '/textures/sprites/Monsters_Creatures_Fantasy/Flying_eye/Attack.png', {
			type: 'rowColumn',
			w: 8,
			h: 1
		})
		.add('death', '/textures/sprites/Monsters_Creatures_Fantasy/Flying_eye/Death.png', {
			type: 'rowColumn',
			w: 4,
			h: 1
		})
		.add('hit', '/textures/sprites/Monsters_Creatures_Fantasy/Flying_eye/Hit.png', {
			type: 'rowColumn',
			w: 4,
			h: 1
		})
		.build();
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

<!-- {#await spritesheet then { spritesheet, texture }}
	<AnimatedInstancedSprite {spritesheet} {texture} fps={10} loop={true} {count}>
		<FlyerUpdater />
	</AnimatedInstancedSprite>
{/await} -->

<Sky elevation={0.15} />
<!-- <T.AmbientLight /> -->

<T.Mesh rotation.x={-DEG2RAD * 90} receiveShadow>
	<T.PlaneGeometry args={[1000, 100]} />
	<T.MeshStandardMaterial color={'#aa6644'} />
</T.Mesh>

<Grid infiniteGrid type={'grid'} sectionThickness={0.0} position.y={0.01} />
