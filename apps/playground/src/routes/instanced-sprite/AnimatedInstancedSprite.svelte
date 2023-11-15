<script lang="ts">
	import {
		InstancedSpriteMesh,
		makeDataTexture,
		parseAseprite
	} from '@threejs-kit/instanced-sprite-mesh';
	import { T, useFrame, useLoader, useThrelte, watch } from '@threlte/core';
	import {
		DoubleSide,
		FileLoader,
		LinearFilter,
		Matrix4,
		MeshStandardMaterial,
		NearestFilter,
		PlaneGeometry,
		RepeatWrapping,
		ShaderMaterial,
		type Texture,
		type Vector3Tuple
	} from 'three';
	import type {
		AnimatedInstancedSpriteEvents,
		AnimatedInstancedSpriteProps,
		AnimatedInstancedSpriteSlots
	} from './AnimatedInstancedSprite.svelte';

	import { useSuspense, useTexture } from '@threlte/extras';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

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

	const baseMaterial = new MeshStandardMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide
	});

	const suspend = useSuspense();

	const mesh: InstancedSpriteMesh<MeshStandardMaterial> = new InstancedSpriteMesh(
		baseMaterial,
		count
	);

	const textureStore = suspend(
		useTexture(textureUrl, {
			transform: (value: Texture) => {
				value.matrixAutoUpdate = false;
				value.generateMipmaps = false;
				value.premultiplyAlpha = false;
				value.wrapS = value.wrapT = RepeatWrapping;
				value.magFilter = value.minFilter = filter === 'nearest' ? NearestFilter : LinearFilter;
				return value;
			}
		})
	);

	watch(textureStore, () => {
		mesh.material.map = $textureStore;
		mesh.material.needsUpdate = true;
	});

	const jsonStore = useLoader(FileLoader).load(dataUrl, {
		transform: (file) => {
			if (typeof file !== 'string') return;
			try {
				return JSON.parse(file);
			} catch {
				return;
			}
		}
	});

	const animationMap = writable<Map<string, number>>(new Map());

	watch(jsonStore, (rawSpritesheet) => {
		if (rawSpritesheet) {
			const spritesheet = parseAseprite(rawSpritesheet);
			mesh.spritesheet = spritesheet;
			animationMap.set(mesh.animationMap);
		}
	});

	$: mesh.material.uniforms.fps.value = fps;

	$: mesh.loop.setGlobal(loop);

	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	const updatePosition = (id: number, position: Vector3Tuple) => {
		tempMatrix.setPosition(...position);
		mesh.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	};

	const { clock } = useThrelte();

	const setAnimation = (instanceId: number, animationId: string) => {
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
		mesh.updateTime();
	});

	useFrame(({ clock }) => {
		if (dirtyInstanceMatrix) {
			mesh.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
	});
</script>

<T is={mesh} />

<slot />
