<script lang="ts">
	import { createNoise2D } from 'simplex-noise';
	import { PlaneGeometry } from 'three';
	import { T } from '@threlte/core';
	import { DEG2RAD } from 'three/src/math/MathUtils';
	import { generateBoxUVs } from './unwrap';

	export let size = 300;
	export let nsubdivs = 200;
	export let amplitude = 4;
	let heights: any[] = [];

	import alea from 'alea';
	// create a new random function based on the seed
	export let seed: string | undefined;

	$: prng = seed ? alea(seed) : undefined;

	export const geometry = new PlaneGeometry(size, size, nsubdivs, nsubdivs);

	// const geometry = new PlaneGeometry(size, size, nsubdivs, nsubdivs);
	const noise = createNoise2D(prng);
	const vertices = geometry.getAttribute('position').array;

	for (let x = 0; x <= nsubdivs; x++) {
		for (let y = 0; y <= nsubdivs; y++) {
			let height =
				noise(x / 40, y / 40) * amplitude +
				noise(x / 80, y / 80) * amplitude +
				(noise(x / 10, y / 10) * amplitude) / 3;

			const vertIndex = (x + (nsubdivs + 1) * y) * 3;
			//@ts-ignore
			vertices[vertIndex + 2] = height;
			const heightIndex = y + (nsubdivs + 1) * x;
			heights[heightIndex] = height;
		}
	}

	// needed for lighting
	// generateBoxUVs(geometry);
	geometry.computeVertexNormals();
	geometry.computeTangents();
</script>

<T.Mesh args={[geometry]} rotation.x={DEG2RAD * -90} receiveShadow>
	<slot />
</T.Mesh>
