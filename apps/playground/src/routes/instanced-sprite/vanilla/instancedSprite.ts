import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import rawSpritesheet from './player.json?raw';
import { InstancedSpriteMesh, parseAseprite } from '@threejs-kit/instanced-sprite-mesh';

export const start = async () => {
	const INSTANCE_COUNT = 10000;

	// GENERAL SCENE SETUP
	const camera = new THREE.PerspectiveCamera(
		36,
		window.innerWidth / window.innerHeight,
		0.01,
		2000
	);
	camera.position.set(0, 7, 15);
	const scene = new THREE.Scene();
	const renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	const stats = new Stats();
	document.body.appendChild(stats.dom);

	sceneSetup();

	// INSTANCED SPRITE SETUP
	type SpriteAnimations =
		| 'RunRight'
		| 'RunLeft'
		| 'RunForward'
		| 'IdleRight'
		| 'IdleLeft'
		| 'IdleForward'
		| 'RunBackward'
		| 'IdleBackward';
	const sprite = spriteMeshSetup();
	scene.add(sprite);
	sprite.castShadow = true;

	// UPDATING AND MOVING SPRITES

	let dirtyInstanceMatrix = false;

	const tempMatrix = new THREE.Matrix4();
	function updatePosition(id: number, position: THREE.Vector3Tuple) {
		tempMatrix.setPosition(...position);
		sprite.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	}

	const posX: number[] = new Array(INSTANCE_COUNT).fill(0);
	const posZ: number[] = new Array(INSTANCE_COUNT).fill(0);

	type Agent = {
		action: 'Idle' | 'Run';
		velocity: [number, number];
		timer: number;
	};

	const agents: Agent[] = [];
	const { updateAgents, pickAnimation } = setupRandomAgents();

	const dirs = {
		up: false,
		down: false,
		left: false,
		right: false
	};

	// Player movement & indicator
	const playerMoveVector = new THREE.Vector2(0, 0);
	const playerIndicator = new THREE.Mesh(
		new THREE.SphereGeometry(0.15, 3, 2),
		new THREE.MeshBasicMaterial({ color: 'lime' })
	);
	scene.add(playerIndicator);

	const updatePlayerMovement = () => {
		playerMoveVector.setX((dirs.left ? -1 : 0) + (dirs.right ? 1 : 0));
		playerMoveVector.setY((dirs.up ? -1 : 0) + (dirs.down ? 1 : 0));

		// player is agent 0
		agents[0].velocity = playerMoveVector.normalize().multiplyScalar(3).toArray();

		const animation = pickAnimation(0);
		sprite.play(animation, true, 'FORWARD').at(0);
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'a' || e.key === 'ArrowLeft') dirs.left = true;
		if (e.key === 'd' || e.key === 'ArrowRight') dirs.right = true;
		if (e.key === 'w' || e.key === 'ArrowUp') dirs.up = true;
		if (e.key === 's' || e.key === 'ArrowDown') dirs.down = true;
		updatePlayerMovement();
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.key === 'a' || e.key === 'ArrowLeft') dirs.left = false;
		if (e.key === 'd' || e.key === 'ArrowRight') dirs.right = false;
		if (e.key === 'w' || e.key === 'ArrowUp') dirs.up = false;
		if (e.key === 's' || e.key === 'ArrowDown') dirs.down = false;
		updatePlayerMovement();
	};

	window.addEventListener('keydown', handleKeyDown);
	window.addEventListener('keyup', handleKeyUp);

	animate();

	function setupRandomAgents() {
		const spread = 400;
		const minCenterDistance = 5;
		const maxCenterDistance = spread;
		const rndPosition: any = () => {
			const x = Math.random() * spread - spread / 2;
			const y = Math.random() * spread - spread / 2;

			/** min distance from 0,0. Recursive reroll if too close */

			if (Math.sqrt(x ** 2 + y ** 2) < minCenterDistance) {
				return rndPosition();
			}

			return { x, y };
		};

		/** update from 1 because 0 is user controlled and set at 0,0 */
		for (let i = 1; i < INSTANCE_COUNT; i++) {
			const pos = rndPosition();
			posX[i] = pos.x;
			posZ[i] = pos.y;
		}

		for (let i = 0; i < INSTANCE_COUNT; i++) {
			agents.push({
				action: 'Run',
				timer: 0.1,
				velocity: [0, 1]
			});
		}

		const pickAnimation = (i: number) => {
			const dirWords = ['Forward', 'Backward', 'Left', 'Right'];

			const isHorizontal =
				Math.abs(agents[i].velocity[0] * 2) > Math.abs(agents[i].velocity[1]) ? 2 : 0;
			const isLeft = agents[i].velocity[0] > 0 ? 1 : 0;
			const isUp = agents[i].velocity[1] > 0 ? 0 : 1;

			const secondMod = isHorizontal ? isLeft : isUp;
			const chosenWord = dirWords.slice(0 + isHorizontal, 2 + isHorizontal);

			const animationName = `${agents[i].action}${chosenWord[secondMod]}` as SpriteAnimations;

			return animationName;
		};
		const velocityHelper = new THREE.Vector2(0, 0);

		const updateAgents = (delta: number) => {
			for (let i = 0; i < agents.length; i++) {
				// timer
				agents[i].timer -= delta;

				// apply velocity
				posX[i] += agents[i].velocity[0] * delta;
				posZ[i] += agents[i].velocity[1] * delta;

				// roll new behaviour when time runs out or agent gets out of bounds
				if (i > 0) {
					const dist = Math.sqrt((posX[i] || 0) ** 2 + (posZ[i] || 0) ** 2);
					if (agents[i].timer < 0 || dist < minCenterDistance || dist > maxCenterDistance) {
						const runChance = 0.6 + (agents[i].action === 'Idle' ? 0.3 : 0);
						agents[i].action = Math.random() < runChance ? 'Run' : 'Idle';

						agents[i].timer = 5 + Math.random() * 5;

						if (agents[i].action === 'Run') {
							velocityHelper
								.set(Math.random() - 0.5, Math.random() - 0.5)
								.normalize()
								.multiplyScalar(3);
							agents[i].velocity = velocityHelper.toArray();
						}

						const animation: SpriteAnimations = pickAnimation(i);
						if (agents[i].action === 'Idle') {
							agents[i].velocity = [0, 0];
						}

						sprite.play(animation, true, 'FORWARD').at(i);
					}
				}
			}

			for (let i = 0; i < INSTANCE_COUNT; i++) {
				updatePosition(i, [posX[i] || 0, 0.5, posZ[i] || 0]);
			}
		};

		return { updateAgents, pickAnimation };
	}

	function sceneSetup() {
		// Lights
		scene.add(new THREE.AmbientLight(0xcccccc));

		const dirLight = new THREE.DirectionalLight(0x55505a, 3);
		dirLight.position.set(0, 4, -10);
		dirLight.castShadow = true;
		dirLight.shadow.camera.near = 1;
		dirLight.shadow.camera.far = 128;

		dirLight.shadow.camera.right = 20;
		dirLight.shadow.camera.left = -20;
		dirLight.shadow.camera.top = 20;
		dirLight.shadow.camera.bottom = -20;
		dirLight.shadow.bias = -0.001;

		dirLight.shadow.mapSize.width = 1024;
		dirLight.shadow.mapSize.height = 1024;
		scene.add(dirLight);

		const ground = new THREE.Mesh(
			new THREE.PlaneGeometry(2000, 2000, 1, 1),
			new THREE.MeshPhongMaterial({ color: 0x99cc88, shininess: 0 })
		);

		ground.rotation.x = -Math.PI / 2; // rotates X/Y to X/Z
		ground.receiveShadow = true;
		scene.add(ground);

		// Stats

		// Renderer

		window.addEventListener('resize', onWindowResize);

		// Controls
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.target.set(0, 1, 0);
		controls.update();
	}

	function spriteMeshSetup() {
		// dataUrl="/textures/sprites/player.json"
		const texture = new THREE.TextureLoader().load('/textures/sprites/player.png');
		texture.minFilter = THREE.NearestFilter;
		texture.magFilter = THREE.NearestFilter;

		const baseMaterial = new THREE.MeshBasicMaterial({
			transparent: true,
			alphaTest: 0.01,
			// needs to be double side for shading
			side: THREE.DoubleSide,
			map: texture
		});

		const mesh: InstancedSpriteMesh<THREE.MeshBasicMaterial, SpriteAnimations> =
			new InstancedSpriteMesh(baseMaterial, INSTANCE_COUNT, renderer);

		mesh.fps = 15;

		const spritesheet = parseAseprite(JSON.parse(rawSpritesheet));
		mesh.spritesheet = spritesheet;

		return mesh;
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	function animate() {
		requestAnimationFrame(animate);
		stats.begin();
		renderer.render(scene, camera);
		playerIndicator.position.set(posX[0], 2, posZ[0]);
		updateAgents(0.01);

		sprite.update();

		if (dirtyInstanceMatrix) {
			sprite.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
		stats.end();
	}
};
