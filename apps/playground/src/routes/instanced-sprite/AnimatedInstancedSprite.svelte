<script lang="ts">
	import { T, useFrame, useLoader, watch } from '@threlte/core';
	import {
		InstancedSpriteMesh,
		makeDataTexture,
		parseAseprite,
		spriteMaterial
	} from '@threejs-kit/instanced-sprite-mesh';
	import {
		BufferGeometry,
		DoubleSide,
		FileLoader,
		LinearFilter,
		Matrix4,
		MeshBasicMaterial,
		MeshStandardMaterial,
		NearestFilter,
		PlaneGeometry,
		RepeatWrapping,
		ShaderMaterial,
		Vector3,
		type Texture,
		type Vector3Tuple
	} from 'three';
	import type {
		AnimatedInstancedSpriteEvents,
		AnimatedInstancedSpriteProps,
		AnimatedInstancedSpriteSlots
	} from './AnimatedInstancedSprite.svelte';

	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { useSuspense, useTexture } from '@threlte/extras';

	type $$Props = Required<AnimatedInstancedSpriteProps>;
	type $$Events = AnimatedInstancedSpriteEvents;
	type $$Slots = AnimatedInstancedSpriteSlots;

	export let textureUrl: $$Props['textureUrl'];
	export let dataUrl: $$Props['dataUrl'] = '';
	// export let animation: $$Props['animation'] = ''
	// export let loop: $$Props['loop'] = true
	// export let autoplay: $$Props['autoplay'] = true
	export let count: $$Props['count'] = 1000;
	export let fps: $$Props['fps'] = 15;
	export let filter: $$Props['filter'] = 'nearest';
	// export let alphaTest: $$Props['alphaTest'] = 0.1
	// export let delay: $$Props['delay'] = 0
	// export let transparent: $$Props['transparent'] = true
	// export let flipX: $$Props['flipX'] = false

	const baseMaterial = new MeshStandardMaterial({
		transparent: true,
		alphaTest: 0.99,
		// needs to be double side for shading
		side: DoubleSide
	});

	const material = spriteMaterial(baseMaterial);

	const suspend = useSuspense();

	let mesh: InstancedSpriteMesh<ShaderMaterial> = new InstancedSpriteMesh(
		new PlaneGeometry(),
		material,
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
			const { dataTexture, dataWidth, dataHeight, animMap } = makeDataTexture(
				parseAseprite(rawSpritesheet)
			);
			mesh.material.uniforms.spritesheetData.value = dataTexture;
			mesh.material.uniforms.dataSize.value.x = dataWidth;
			mesh.material.uniforms.dataSize.value.y = dataHeight;

			mesh.material.needsUpdate = true;
			animationMap.set(animMap);
		}
	});

	$: material.uniforms.fps.value = fps;

	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	const updatePosition = (id: number, position: Vector3Tuple) => {
		tempMatrix.setPosition(...position);
		mesh.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	};

	const setAnimation = (instanceId: number, animationId: number) => {
		mesh.setUniformAt('animationId', instanceId, animationId);
	};

	setContext('instanced-sprite-ctx', {
		mesh,
		count,
		animationMap,
		updatePosition,
		setAnimation
	});

	useFrame(({ clock }) => {
		mesh.material.uniforms.time.value = clock.getElapsedTime();
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
