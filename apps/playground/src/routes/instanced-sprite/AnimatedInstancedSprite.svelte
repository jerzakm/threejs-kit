<script lang="ts">
	import {
		InstancedSpriteMesh,
		parseAseprite,
		type SpritesheetFormat
	} from '@threejs-kit/instanced-sprite-mesh';
	import { T, useFrame, useLoader, useThrelte, watch } from '@threlte/core';
	import {
		DoubleSide,
		FileLoader,
		LinearFilter,
		Matrix4,
		MeshBasicMaterial,
		NearestFilter,
		PlaneGeometry,
		RepeatWrapping,
		type Texture,
		type Vector3Tuple
	} from 'three';
	import type {
		AnimatedInstancedSpriteEvents,
		AnimatedInstancedSpriteProps,
		AnimatedInstancedSpriteSlots
	} from './AnimatedInstancedSprite.svelte';

	import { useTexture } from '@threlte/extras';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import PreviewMaterial from './PreviewMaterial.svelte';

	type $$Props = Required<AnimatedInstancedSpriteProps>;
	type $$Events = AnimatedInstancedSpriteEvents;
	type $$Slots = AnimatedInstancedSpriteSlots;

	export let textureUrl: $$Props['textureUrl'];
	export let dataUrl: $$Props['dataUrl'] = '';
	// export let animation: $$Props['animation'] = ''
	export let loop: $$Props['loop'] = true;
	// export let autoplay: $$Props['autoplay'] = true;
	export let count: $$Props['count'] = 1000;
	export let fps: $$Props['fps'] = 15;
	export let filter: $$Props['filter'] = 'nearest';
	// export let alphaTest: $$Props['alphaTest'] = 0.1
	// export let delay: $$Props['delay'] = 0
	// export let transparent: $$Props['transparent'] = true
	// export let flipX: $$Props['flipX'] = false

	export let texture: Texture | undefined = undefined;
	export let spritesheet: SpritesheetFormat | undefined = undefined;

	const baseMaterial = new MeshBasicMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide
	});

	type SpriteAnimations =
		| 'RunRight'
		| 'RunLeft'
		| 'RunForward'
		| 'IdleRight'
		| 'IdleLeft'
		| 'IdleForward'
		| 'RunBackward'
		| 'IdleBackward';

	const { renderer } = useThrelte();

	const mesh: InstancedSpriteMesh<MeshBasicMaterial, SpriteAnimations> = new InstancedSpriteMesh(
		baseMaterial,
		count,
		renderer,
		{
			triGeometry: true
		}
	);

	console.log(mesh.compute);

	const textureStore = texture
		? writable(texture)
		: useTexture(textureUrl, {
				transform: (value: Texture) => {
					value.matrixAutoUpdate = false;
					value.generateMipmaps = false;
					value.premultiplyAlpha = false;
					value.wrapS = value.wrapT = RepeatWrapping;
					value.magFilter = value.minFilter = filter === 'nearest' ? NearestFilter : LinearFilter;
					return value;
				}
		  });

	watch(textureStore, () => {
		mesh.material.map = $textureStore;
		mesh.material.needsUpdate = true;
	});

	const jsonStore = spritesheet
		? writable(spritesheet)
		: useLoader(FileLoader).load(dataUrl, {
				transform: (file) => {
					if (typeof file !== 'string') return;
					try {
						return JSON.parse(file);
					} catch {
						return;
					}
				}
		  });

	const animationMap = writable<Map<SpriteAnimations, number>>(new Map());

	watch(jsonStore, (rawSpritesheet) => {
		if (rawSpritesheet && !spritesheet) {
			const spritesheet = parseAseprite(rawSpritesheet);
			console.log({ spritesheet });
			mesh.spritesheet = spritesheet;
			animationMap.set(mesh.animationMap);
		}

		if (spritesheet) {
			mesh.spritesheet = spritesheet;
			animationMap.set(mesh.animationMap);
		}
	});

	$: mesh.fps = fps;

	$: mesh.loop.setGlobal(loop);

	let initialized = false;

	$: {
		if ($textureStore && mesh.material && !initialized && mesh) {
			mesh.castShadow = true;
		}
	}

	// mesh.scale.set(2, 2, 2);

	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	const updatePosition = (id: number, position: Vector3Tuple) => {
		tempMatrix.setPosition(...position);
		mesh.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	};

	const { clock } = useThrelte();

	const setAnimation = (instanceId: number, animationId: SpriteAnimations) => {
		mesh.animation.setAt(instanceId, animationId);
		// mesh.loop.setGlobal(false);
	};

	setContext('instanced-sprite-ctx', {
		mesh,
		count,
		animationMap,
		updatePosition,
		setAnimation
	});

	useFrame(() => {
		// mesh.compute.rtSmall.texture.needsUpdate = true;
		mesh.updateTime();
		mesh.compute.gpuCompute.compute();
	});

	useFrame(({ clock }) => {
		if (dirtyInstanceMatrix) {
			mesh.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
	});

	let j = 0;
	useFrame(() => {
		const computeSize = 256;
		let row = j % (computeSize * 4);

		if (j % 1 == 0) {
			for (let i = 0; i < computeSize * 4; i++) {
				const index = computeSize * row + i;
				mesh.compute.progressDataTexture.image.data[index] = Math.random();
			}

			// mesh.compute.progressDataTexture.needsUpdate = true;
		}

		j++;
	});
</script>

<T.Mesh position.y={4}>
	<T.PlaneGeometry args={[1, 1]} />
	<PreviewMaterial
		texture={mesh.compute.gpuCompute.getCurrentRenderTarget(mesh.compute.variables.progressVariable)
			.texture}
	/>
</T.Mesh>

<T is={mesh} />

<slot />
