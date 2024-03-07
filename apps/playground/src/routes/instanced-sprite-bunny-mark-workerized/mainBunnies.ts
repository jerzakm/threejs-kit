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

import { initBunnies } from './bunny';

export const clock = new Clock(true);

export const initBunBench = async (count = 100000) => {
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

	// Controls
	// const controls = new OrbitControls(camera, renderer.domElement);
	// controls.target.set(0, 3, 0);
	// controls.update();

	const bunnies = await initBunnies(renderer, scene, count);

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

	const bounds = {
		left: 0,
		right: window.innerWidth,
		bottom: 0,
		top: window.innerHeight
	};

	const url = new URL('./BunnyWorker.ts', import.meta.url);

	const numInstances = count;
	const valuesPerInstance = 2;
	const bytesPerValue = 4; // Float32

	// x,y
	const positionsBuffer = new SharedArrayBuffer(numInstances * valuesPerInstance * bytesPerValue);
	const positionArray = new Float32Array(positionsBuffer);

	// vX, vY
	const velocityBuffer = new SharedArrayBuffer(numInstances * valuesPerInstance * bytesPerValue);
	const velocityArray = new Float32Array(velocityBuffer);

	const zIndex: number[] = new Array(count).fill(0);
	for (let i = 0; i < count; i++) {
		zIndex[i] = -Math.random() * 10;

		velocityArray[i * 2] = Math.random() * 10;
		velocityArray[i * 2 + 1] = Math.random() * 10 - 5;
	}

	let workersToSpawn = navigator.hardwareConcurrency
		? Math.floor(navigator.hardwareConcurrency / 2)
		: 2;

	// workersToSpawn = 1;
	console.log(`This device appears to have ${navigator.hardwareConcurrency} logical cores.`);
	console.log(`We're spawning ${workersToSpawn} workers:`);

	let countHandledTotal = 0;
	const countPerWorker = Math.ceil(count / workersToSpawn);
	for (let i = 0; i < workersToSpawn; i++) {
		const countToHandle =
			countHandledTotal + countPerWorker < count ? countPerWorker : count - countHandledTotal;

		const from = countHandledTotal;
		const to = from + countToHandle;
		countHandledTotal += countToHandle;
		console.log(`Worker ${i} handles ${countToHandle} instances - from ${from} to ${to}`);

		const worker = new Worker(url, { type: 'module', name: `bunnies_${i}` });
		worker.postMessage({
			count,
			positionsBuffer,
			velocityBuffer,
			gravity: 0.75,
			bounds,
			type: 'setup',
			from,
			to
		});
	}

	let f = 0;
	sceneSetup();
	animate();
	function animate() {
		f++;
		requestAnimationFrame(animate);
		stats.begin();
		perf.begin();
		// timer.update();
		// const delta = timer.getDelta();

		bunnies.sprite.update();
		for (let i = 0; i < count; i++) {
			const x = positionArray[i * 2];
			const y = positionArray[i * 2 + 1];

			bunnies.updatePosition(i, [x, y, zIndex[i]]);
		}

		bunnies.sprite.instanceMatrix.needsUpdate = true;
		renderer.render(scene, camera);
		perf.end();
		stats.end();
	}
};
