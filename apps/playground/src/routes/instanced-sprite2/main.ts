import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { ThreePerf } from 'three-perf';

import {
	AmbientLight,
	BoxGeometry,
	Clock,
	Mesh,
	MeshBasicMaterial,
	PCFSoftShadowMap,
	PerspectiveCamera,
	SRGBColorSpace,
	Scene,
	WebGLRenderer
} from 'three';

import { initSpriteFlyers } from './spriteFlyers';

export const clock = new Clock(true);

export const start = async () => {
	// GENERAL SCENE SETUP
	const camera = new PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.01, 2000);
	camera.position.set(0, 7, 15);
	const scene = new Scene();

	const canvas = document.getElementById('three-canvas');
	if (!canvas) return;
	const renderer = new WebGLRenderer({
		canvas
	});

	renderer.outputColorSpace = SRGBColorSpace;

	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = PCFSoftShadowMap;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	const perf = new ThreePerf({
		anchorX: 'left',
		anchorY: 'top',
		domElement: document.body, // or other canvas rendering wrapper
		renderer: renderer // three js renderer instance you use for rendering
	});

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 3, 0);
	controls.update();

	const spriteFlyers = await initSpriteFlyers(renderer, scene, 10000);

	sceneSetup();
	animate();

	function sceneSetup() {
		const ambient = new AmbientLight('#ddddff', 3.19);
		scene.add(ambient);

		const dataTextureCube = new Mesh(
			new BoxGeometry(),
			new MeshBasicMaterial({
				map: spriteFlyers.sprite.compute.animationRunner.renderTargets[0].texture,
				color: 'red'
			})
		);
		scene.add(dataTextureCube);
	}

	window.addEventListener('resize', onWindowResize);

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function animate() {
		requestAnimationFrame(animate);

		perf.begin();

		const delta = clock.getDelta();

		spriteFlyers.update(delta);
		renderer.render(scene, camera);
		camera.updateMatrixWorld();
		perf.end();
	}
};
