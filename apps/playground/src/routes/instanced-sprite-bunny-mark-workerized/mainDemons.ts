import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ThreePerf } from 'three-perf';

import {
	AmbientLight,
	Clock,
	OrthographicCamera,
	SRGBColorSpace,
	Scene,
	WebGLRenderer
} from 'three';
import { initDemons } from './demon';

export const clock = new Clock(true);

export const initDemonBench = async (count = 100000) => {
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
		canvas,
		powerPreference: 'high-performance'
	});

	renderer.outputColorSpace = SRGBColorSpace;

	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(pixelRatio);

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	const demons = await initDemons(renderer, scene, count);

	function sceneSetup() {
		const ambient = new AmbientLight('#ddddff', 1.19);
		scene.add(ambient);
	}

	window.addEventListener('resize', onWindowResize);

	const perf = new ThreePerf({
		anchorX: 'left',
		anchorY: 'bottom',
		domElement: document.body, // or other canvas rendering wrapper
		renderer: renderer // three js renderer instance you use for rendering
	});

	function onWindowResize() {
		camera.left = 0;
		camera.right = window.innerWidth;
		camera.top = window.innerHeight;
		camera.bottom = 0;
		// camera.position.set(screenWidth / 2, screenHeight / 2, 10);
		// camera.lookAt(screenWidth / 2, screenHeight / 2, 0);
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	sceneSetup();
	animate();

	function animate() {
		requestAnimationFrame(animate);
		stats.begin();
		perf.begin();
		// timer.update();
		// const delta = timer.getDelta();
		const delta = clock.getDelta();

		demons.update(delta);
		renderer.render(scene, camera);
		perf.end();
		stats.end();
	}
};
