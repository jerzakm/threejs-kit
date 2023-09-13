<script lang="ts">
	import { useThrelte, useRender } from '@threlte/core';
	import {
		EffectComposer,
		EffectPass,
		RenderPass,
		OutlineEffect,
		BlendFunction,
		SMAAEffect,
		SMAAPreset
	} from 'postprocessing';

	// export let selectedMesh: THREE.Mesh;

	const { scene, renderer, camera, size } = useThrelte();

	const composer = new EffectComposer(renderer);

	const setupEffectComposer = (camera: THREE.Camera) => {
		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, camera));

		composer.addPass(
			new EffectPass(
				camera,
				new SMAAEffect({
					preset: SMAAPreset.HIGH
				})
			)
		);
	};

	$: setupEffectComposer($camera);
	$: composer.setSize($size.width, $size.height);

	useRender((_, delta) => {
		composer.render(delta);
	});
</script>
