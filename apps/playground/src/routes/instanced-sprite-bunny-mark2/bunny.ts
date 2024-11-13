import { InstancedSpriteMesh2, createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import {
	DoubleSide,
	Matrix4,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Vector2,
	type Scene,
	type Vector3Tuple,
	type WebGLRenderer
} from 'three';

export const initBunnies = async (renderer: WebGLRenderer, scene: Scene, count: number) => {
	const bunnies = [
		'rabbitv3_ash',
		'rabbitv3_batman',
		'rabbitv3_bb8',
		'rabbitv3_frankenstein',
		'rabbitv3_neo',
		'rabbitv3_sonic',
		'rabbitv3_spidey',
		'rabbitv3_stormtrooper',
		'rabbitv3_superman',
		'rabbitv3_tron',
		'rabbitv3_wolverine',
		'rabbitv3'
	];

	const bunnySpritesheet = createSpritesheet();

	for (const bunny of bunnies) {
		bunnySpritesheet.add(
			`/pixi_bunnies/${bunny}.png`,
			{
				type: 'rowColumn',
				width: 1,
				height: 1
			},
			[{ name: bunny, frameRange: [0, 0] }]
		);
	}

	const { spritesheet, texture } = await bunnySpritesheet.build();

	const baseMaterial = new MeshBasicMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide,
		map: texture
	});

	const sprite = new InstancedSpriteMesh2(baseMaterial, count, renderer, spritesheet);

	sprite.fps = 9;

	// sprite.spritesheet = spritesheet;
	scene.add(sprite);

	sprite.castShadow = true;

	// UPDATING AND MOVING SPRITES
	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, [x, y, z]: Vector3Tuple) {
		tempMatrix.makeScale(25, 32, 1);
		tempMatrix.setPosition(x, bounds.top - y, z);
		sprite.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	}

	const gravity = 0.75;

	const positionX: number[] = new Array(count).fill(0);
	const positionY: number[] = new Array(count).fill(0);
	const zIndex: number[] = new Array(count).fill(0);

	const speedX: number[] = new Array(count).fill(0);
	const speedY: number[] = new Array(count).fill(0);

	const { updateAgents } = setupRandomAgents();

	const bounds = {
		left: 0,
		right: window.innerWidth,
		bottom: 0,
		top: window.innerHeight
	};

	function setupRandomAgents() {
		for (let i = 0; i < count; i++) {
			positionX[i] = 0;
			positionY[i] = 0;
			zIndex[i] = -Math.random() * 10;

			speedX[i] = Math.random() * 10;
			speedY[i] = Math.random() * 10 - 5;

			sprite.animation.setAt(i, bunnies[Math.floor(Math.random() * bunnies.length)]);
		}

		const updateAgents = (delta: number) => {
			for (let i = 0; i < count; i++) {
				delta = 1;
				// timer
				// apply gravity

				// apply velocity
				positionX[i] += speedX[i] * delta;
				positionY[i] += speedY[i] * delta;
				speedY[i] += gravity * delta;

				// roll new behaviour if bunny gets out of bounds

				if (positionX[i] > bounds.right) {
					speedX[i] *= -1;
					positionX[i] = bounds.right;
				} else if (positionX[i] < bounds.left) {
					speedX[i] *= -1;
					positionX[i] = bounds.left;
				}

				if (positionY[i] > bounds.top) {
					speedY[i] *= -0.85;
					positionY[i] = bounds.top;
					if (Math.random() > 0.5) {
						speedY[i] -= Math.random() * 6;
					}
				} else if (positionY[i] < bounds.bottom) {
					speedY[i] *= -1;
					positionY[i] = bounds.top;
				}
			}

			for (let i = 0; i < count; i++) {
				updatePosition(i, [positionX[i], positionY[i], zIndex[i]]);
			}
		};
		sprite.update();

		return { updateAgents };
	}

	let initialized = false;

	const update = (delta: number) => {
		updateAgents(delta);

		sprite.update();

		if (dirtyInstanceMatrix) {
			// sprite.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}

		if (!initialized) {
			sprite.update();
			initialized = true;
		}
	};

	return { update, sprite };
};
