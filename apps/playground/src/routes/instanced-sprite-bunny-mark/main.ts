import Stats from 'three/examples/jsm/libs/stats.module.js';

import {
	AmbientLight,
	Clock,
	OrthographicCamera,
	SRGBColorSpace,
	Scene,
	WebGLRenderer
} from 'three';

import { initBunnies } from './bunny';

export const clock = new Clock(true);

export const start = async (count = 100000) => {
	// GENERAL SCENE SETUP
	const screenWidth = window.innerWidth;
	const screenHeight = window.innerHeight;
	const pixelRatio = window.devicePixelRatio || 1;

	const camera = new OrthographicCamera(0, screenWidth, screenHeight, 0, 1, 1000);
	camera.position.set(0, 0, 10);
	camera.lookAt(0, 0, 0);
	camera.zoom = 1;
	camera.updateProjectionMatrix();
	const scene = new Scene();

	const canvas = document.getElementById('three-canvas');
	if (!canvas) return;
	const renderer = new WebGLRenderer({
		canvas
	});

	renderer.outputColorSpace = SRGBColorSpace;

	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(pixelRatio);

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	// Controls
	// const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 3, 0);
	// controls.update();

	const bunnies = await initBunnies(renderer, scene, count);

	sceneSetup();
	animate();

	function sceneSetup() {
		const ambient = new AmbientLight('#ddddff', 1.19);
		scene.add(ambient);
	}

	window.addEventListener('resize', onWindowResize);

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function animate() {
		requestAnimationFrame(animate);
		stats.begin();
		// timer.update();
		// const delta = timer.getDelta();
		const delta = clock.getDelta();

		bunnies.update(delta);
		renderer.render(scene, camera);

		stats.end();
	}
};
