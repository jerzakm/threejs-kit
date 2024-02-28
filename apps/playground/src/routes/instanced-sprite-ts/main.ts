import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { initPeopleSprite } from './spritePeople';
import {
	PerspectiveCamera,
	Scene,
	WebGLRenderer,
	SRGBColorSpace,
	AmbientLight,
	Mesh,
	PlaneGeometry,
	MeshPhongMaterial,
	MeshBasicMaterial,
	DoubleSide,
	SphereGeometry,
	RepeatWrapping,
	Clock,
	CylinderGeometry,
	BackSide
} from 'three';

import { loadTexture } from './util';
import { initSpriteLights } from './spriteLights';
import { createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import { initSpriteHounds } from './spriteHounds';
import { initSpriteFlyers } from './spriteFlyers';

export const clock = new Clock(true);

let sky: Mesh;

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

	// renderer.toneMapping = AgXToneMapping;
	renderer.outputColorSpace = SRGBColorSpace;

	renderer.shadowMap.enabled = true;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	// Controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 3, 0);
	controls.update();

	sceneSetup();

	const people = initPeopleSprite(renderer, scene, 2000);
	const spriteLights = await initSpriteLights(renderer, scene, 25);
	const spriteHounds = await initSpriteHounds(renderer, scene, 500);
	const spriteFlyers = await initSpriteFlyers(renderer, scene, 2000);

	animate();

	function sceneSetup() {
		// Lights
		scene.add(new AmbientLight(0xccccff, 0.25));

		const groundSize = 1000;
		const groundRepeatFactor = 2;
		const groundTexture = loadTexture('/spritesDemo/floor.png');
		groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping;
		groundTexture.repeat.set(groundSize / groundRepeatFactor, groundSize / groundRepeatFactor);

		const ground = new Mesh(
			new PlaneGeometry(groundSize, groundSize, 1, 1),
			new MeshPhongMaterial({ color: 0x335544, shininess: 0, map: groundTexture, reflectivity: 0 })
		);

		ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
		ground.receiveShadow = true;
		scene.add(ground);

		const townTexture = loadTexture('/spritesDemo/town.png');
		townTexture.wrapS = townTexture.wrapT = RepeatWrapping;
		townTexture.repeat.set(16, 1);
		const town = new Mesh(
			new CylinderGeometry(400, 400, 100, 12, 3, true),
			new MeshBasicMaterial({ map: townTexture, side: DoubleSide, transparent: true })
		);
		town.position.y = 50;

		scene.add(town);

		const skyTexture = loadTexture('/spritesDemo/clouds.png');
		skyTexture.wrapS = skyTexture.wrapT = RepeatWrapping;
		skyTexture.repeat.set(10, 2);
		skyTexture.offset.set(0, 0.12);
		sky = new Mesh(
			new SphereGeometry(600),
			new MeshBasicMaterial({ map: skyTexture, side: BackSide })
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

		stats.end();
	}
};
