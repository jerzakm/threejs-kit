import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Stats from 'three/examples/jsm/libs/stats.module.js';

import {
	AmbientLight,
	Clock,
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

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 3, 0);
	controls.update();

	const spriteFlyers = await initSpriteFlyers(renderer, scene, 2000);

	sceneSetup();
	animate();

	function sceneSetup() {
		const ambient = new AmbientLight('#ddddff', 3.19);
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

		spriteFlyers.update(delta);
		renderer.render(scene, camera);
		camera.updateMatrixWorld();

		stats.end();
	}
};
