<script lang="ts">
	import { createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
	import { T } from '@threlte/core';
	import { Grid, OrbitControls, Sky } from '@threlte/extras';
	import { DEG2RAD } from 'three/src/math/MathUtils.js';
	import AnimatedInstancedSprite from './AnimatedInstancedSprite.svelte';
	import FlyerUpdater from './FlyerUpdater.svelte';
	import PlayerUpdater from './PlayerUpdater.svelte';
	import { MeshBasicMaterial } from 'three';

	const count = 1000;

	const spritesheet = createSpritesheet()
		.add(
			'/textures/sprites/cacodaemon.png',
			{
				type: 'rowColumn',
				width: 8,
				height: 4
			},
			[
				{ name: 'fly', frameRange: [0, 5] },
				{ name: 'attack', frameRange: [8, 13] },
				{ name: 'idle', frameRange: [16, 19] },
				{ name: 'death', frameRange: [24, 31] }
			]
		)
		.build({
			makeSlimGeometry: true,
			slimOptions: {
				vertices: 5,
				alphaTreshold: 0
			}
		});

	const clouds = createSpritesheet()
		.add(
			'/textures/sprites/clouds.png',
			{
				type: 'rowColumn',
				width: 5,
				height: 5
			},
			[{ name: 'fly', frameRange: [0, 24] }]
		)
		.build({
			makeSlimGeometry: true,
			slimOptions: {
				vertices: 5,
				alphaTreshold: 0
			}
		});

	const flyerSpritesheet = createSpritesheet()
		.add(
			'/textures/sprites/Monsters_Creatures_Fantasy/Flying_eye/Flight.png',
			{
				type: 'rowColumn',
				width: 8,
				height: 1
			},
			'fly'
		)
		.build({
			makeSlimGeometry: true
		});
</script>

<T.PerspectiveCamera makeDefault position.z={15} position.y={7}>
	<OrbitControls />
</T.PerspectiveCamera>

<slot />

<!-- <AnimatedInstancedSprite
	textureUrl="/textures/sprites/player.png"
	dataUrl="/textures/sprites/player.json"
	fps={10}
	loop={true}
	count={10000}
>
	<PlayerUpdater />
</AnimatedInstancedSprite> -->

<!-- {#await spritesheet then { spritesheet, texture }}
	<AnimatedInstancedSprite {spritesheet} {texture} fps={10} loop={true} {count}>
		<FlyerUpdater />
	</AnimatedInstancedSprite>
{/await} -->

{#await clouds then { spritesheet, texture, geometry }}
	<T.Mesh {geometry} position.y={4}>
		<T.MeshBasicMaterial color="yellow" wireframe />
	</T.Mesh>
	<AnimatedInstancedSprite {spritesheet} {texture} fps={10} loop={true} count={5000} {geometry}>
		<FlyerUpdater />
	</AnimatedInstancedSprite>

	<!-- <T.Mesh {geometry} position.y={5}>
		<T.MeshBasicMaterial color="yellow" wireframe />
	</T.Mesh> -->
{/await}

<!-- {#await countdownSpritesheet then { spritesheet, texture }}
	<AnimatedInstancedSprite {spritesheet} {texture} fps={1} loop={true} count={count * 25}>
		<FlyerUpdater />
	</AnimatedInstancedSprite>
{/await} -->

<Sky elevation={0.15} />
<!-- <T.AmbientLight /> -->

<Grid infiniteGrid type={'grid'} sectionThickness={0.0} position.y={0.01} />
