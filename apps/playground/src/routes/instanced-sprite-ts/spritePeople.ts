import { InstancedSpriteMesh, parseAseprite } from '@threejs-kit/instanced-sprite-mesh';
import {
	BoxGeometry,
	DoubleSide,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	SphereGeometry,
	Vector2,
	type Scene,
	type Vector3Tuple,
	type WebGLRenderer
} from 'three';
import rawSpritesheet from './player.json?raw';
import { loadTexture } from './util';

export const initPeopleSprite = (renderer: WebGLRenderer, scene: Scene, count: number) => {
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
	// const texture = new TextureLoader().load('/textures/sprites/player.png');
	// texture.minFilter = NearestFilter;
	// texture.magFilter = NearestFilter;
	// texture.colorSpace = SRGBColorSpace;

	const texture = loadTexture('/textures/sprites/player.png');

	const baseMaterial = new MeshStandardMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide,
		map: texture
	});

	const sprite = new InstancedSpriteMesh(baseMaterial, count, renderer);
	sprite.fps = 15;

	const spritesheet = parseAseprite(JSON.parse(rawSpritesheet));
	sprite.spritesheet = spritesheet;
	scene.add(sprite);

	sprite.castShadow = true;

	// UPDATING AND MOVING SPRITES
	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, position: Vector3Tuple) {
		tempMatrix.setPosition(...position);
		sprite.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	}

	const posX: number[] = new Array(count).fill(0);
	const posZ: number[] = new Array(count).fill(0);

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
	const playerMoveVector = new Vector2(0, 0);
	const playerIndicator = new Mesh(
		new SphereGeometry(0.15, 3, 2),
		new MeshBasicMaterial({ color: 'lime' })
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

	function setupRandomAgents() {
		const spread = 300;
		const minCenterDistance = 1;
		const maxCenterDistance = spread;
		const rndPosition: any = () => {
			const x = Math.random() * spread - spread / 2;
			const y = Math.random() * spread - spread;

			/** min distance from 0,0. Recursive reroll if too close */

			if (Math.sqrt(x ** 2 + y ** 2) < minCenterDistance) {
				return rndPosition();
			}

			return { x, y };
		};

		/** update from 1 because 0 is user controlled and set at 0,0 */
		for (let i = 1; i < count; i++) {
			const pos = rndPosition();
			posX[i] = pos.x;
			posZ[i] = pos.y;
		}

		for (let i = 0; i < count; i++) {
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
		const velocityHelper = new Vector2(0, 0);

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

			for (let i = 0; i < count; i++) {
				updatePosition(i, [posX[i] || 0, 0.5, posZ[i] || 0]);
			}
		};

		return { updateAgents, pickAnimation };
	}

	const update = (delta: number) => {
		playerIndicator.position.set(posX[0], 2, posZ[0]);
		updateAgents(delta);

		sprite.update();

		if (dirtyInstanceMatrix) {
			sprite.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
	};

	return { update, sprite };
};
