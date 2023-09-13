<script lang="ts">
	import { MeshParallaxMaterial } from '@threejs-kit/materials';
	import { T } from '@threlte/core';
	import { useTexture } from '@threlte/extras';

	import * as THREE from 'three';

	const material = new MeshParallaxMaterial(
		{},
		{
			// debugQualityMask: true,
			parallaxMinLayers: 64,
			parallaxMaxLayers: 128,
			cutoffDistance: 1000,
			parallaxScale: 0.1
		}
	);

	// const bump = useTexture('/ixxie/bump.jpg');
	const bump = useTexture('/stonewall/dis.jpg');
	const diffuse = useTexture('/stonewall/diff.jpg');
	const normal = useTexture('/stonewall/normal.jpg');

	export let repeat = 1;

	$: {
		material.repeatUv.set(repeat, repeat);
	}

	$: {
		if ($diffuse && $bump && $normal) {
			$diffuse.wrapS = THREE.RepeatWrapping;
			$diffuse.wrapT = THREE.RepeatWrapping;
			$diffuse.repeat.x = repeat;
			$diffuse.repeat.y = repeat;
			$diffuse.needsUpdate = true;
			material.map = $diffuse;

			$bump.wrapS = THREE.RepeatWrapping;
			$bump.wrapT = THREE.RepeatWrapping;
			$bump.repeat.x = repeat;
			$bump.repeat.y = repeat;
			$bump.needsUpdate = true;
			material.parallaxOcclusionMap = $bump;

			$normal.wrapS = THREE.RepeatWrapping;
			$normal.wrapT = THREE.RepeatWrapping;
			$normal.repeat.x = repeat;
			$normal.repeat.y = repeat;
			$normal.needsUpdate = true;

			material.normalMap = $normal;

			material.envMapIntensity = 0.1;
		}

		material.needsUpdate = true;
		// material.side = THREE.DoubleSide;
	}
</script>

<T is={material} />
