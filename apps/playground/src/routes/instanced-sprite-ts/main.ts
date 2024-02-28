import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSM } from 'three/examples/jsm/csm/CSM.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import {
	AmbientLight,
	BackSide,
	Clock,
	CylinderGeometry,
	DoubleSide,
	Mesh,
	MeshBasicMaterial,
	MeshPhongMaterial,
	PCFSoftShadowMap,
	PerspectiveCamera,
	PlaneGeometry,
	RepeatWrapping,
	SRGBColorSpace,
	Scene,
	SphereGeometry,
	Vector3,
	WebGLRenderer
} from 'three';

import { initSpriteFlyers } from './spriteFlyers';
import { initSpriteHounds } from './spriteHounds';
import { initSpriteLights } from './spriteLights';
import { initPeopleSprite } from './spritePeople';
import { loadTexture } from './util';

export const clock = new Clock(true);

let sky: Mesh;

export let csm: CSM;

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

	csm = new CSM({
		maxFar: 1000,
		cascades: 2,
		mode: 'practical',
		parent: scene,
		shadowMapSize: 2048,
		lightDirection: new Vector3(0, -1, 3).normalize(),
		camera: camera,
		lightIntensity: 0.25,
		shadowBias: 0.0001
	});

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 3, 0);
	controls.update();

	const people = initPeopleSprite(renderer, scene, 8000);
	const spriteLights = await initSpriteLights(renderer, scene, 25);
	const spriteHounds = await initSpriteHounds(renderer, scene, 1500);
	const spriteFlyers = await initSpriteFlyers(renderer, scene, 2000);

	sceneSetup();
	animate();

	function sceneSetup() {
		const ambient = new AmbientLight('#ccccff', 0.09);
		scene.add(ambient);

		const groundSize = 1000;
		const groundRepeatFactor = 2;
		const groundTexture = loadTexture('/spritesDemo/floor.png');
		groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping;
		groundTexture.repeat.set(groundSize / groundRepeatFactor, groundSize / groundRepeatFactor);

		const ground = new Mesh(
			new PlaneGeometry(groundSize, groundSize, 1, 1),
			new MeshPhongMaterial({
				map: groundTexture,
				reflectivity: 0,
				shininess: 0
			})
		);

		csm.setupMaterial(ground.material);

		ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
		ground.receiveShadow = true;
		scene.add(ground);

		const townTexture = loadTexture('/spritesDemo/town.png');
		townTexture.wrapS = townTexture.wrapT = RepeatWrapping;
		townTexture.repeat.set(16, 1);
		const town = new Mesh(
			new CylinderGeometry(400, 400, 100, 12, 3, true),
			new MeshBasicMaterial({ map: townTexture, side: DoubleSide, transparent: true, fog: false })
		);
		town.position.y = 50;

		scene.add(town);

		const skyTexture = loadTexture('/spritesDemo/clouds.png');
		skyTexture.wrapS = skyTexture.wrapT = RepeatWrapping;
		skyTexture.repeat.set(10, 2);
		skyTexture.offset.set(0, 0.12);
		sky = new Mesh(
			new SphereGeometry(600),
			new MeshBasicMaterial({ map: skyTexture, side: BackSide, fog: false })
		);

		scene.add(sky);
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

		if (sky) sky.rotation.y += 0.005 * delta;
		people.update(delta);
		spriteLights.update();
		spriteHounds.update(delta);
		spriteFlyers.update(delta);
		renderer.render(scene, camera);
		camera.updateMatrixWorld();
		csm.updateFrustums();
		csm.update();

		stats.end();
	}
};
