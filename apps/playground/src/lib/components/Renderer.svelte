<script lang="ts">
	import { useThrelte, useRender, useFrame } from '@threlte/core';
	import {
		EffectComposer,
		EffectPass,
		RenderPass,
		OutlineEffect,
		BlendFunction,
		SMAAEffect,
		SMAAPreset
	} from 'postprocessing';
	import { LinearToneMapping } from 'three';

	import { ThreePerf } from 'three-perf';

	// export let selectedMesh: THREE.Mesh;

	const { scene, renderer, camera, size } = useThrelte();

	renderer.toneMapping = LinearToneMapping;

	const composer = new EffectComposer(renderer);

	// const setupEffectComposer = (camera: THREE.Camera) => {
	// 	composer.removeAllPasses();
	// 	composer.addPass(new RenderPass(scene, camera));

	// 	composer.addPass(
	// 		new EffectPass(
	// 			camera,
	// 			new SMAAEffect({
	// 				preset: SMAAPreset.HIGH
	// 			})
	// 		)
	// 	);
	// };

	// $: setupEffectComposer($camera);
	// $: composer.setSize($size.width, $size.height);

	const perf = new ThreePerf({
		anchorX: 'left',
		anchorY: 'top',
		domElement: document.body, // or other canvas rendering wrapper
		renderer: renderer // three js renderer instance you use for rendering,
	});

	useRender((_, delta) => {
		perf.begin();
		renderer.render(scene, $camera);
		perf.end();
		// composer.render(delta);
	});
</script>
