import { InstancedSpriteMesh2, createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import {
	DoubleSide,
	Matrix4,
	MeshBasicMaterial,
	type Scene,
	type Vector3Tuple,
	type WebGLRenderer
} from 'three';

export const initDemons = async (renderer: WebGLRenderer, scene: Scene, count: number) => {
	const { texture, spritesheet, geometry } = await createSpritesheet()
		.add(
			'/textures/sprites/cacodaemon.png',
			{
				type: 'rowColumn',
				width: 8,
				height: 4
			},
			[
				{ name: 'fly', frameRange: [0, 5] },
				{ name: 'attack', frameRange: [8, 13] },
				{ name: 'idle', frameRange: [16, 19] },
				{ name: 'death', frameRange: [24, 31] }
			]
		)
		.build({
			makeSlimGeometry: true,
			slimOptions: {
				vertices: 4,
				alphaThreshold: 0.01
			}
		});

	const baseMaterial = new MeshBasicMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide,
		map: texture
	});

	const sprite = new InstancedSpriteMesh2(baseMaterial, count, renderer, spritesheet);

	sprite.fps = 9;
	sprite.playmode.setAll('FORWARD');
	sprite.loop.setAll(true);

	// sprite.spritesheet = spritesheet;
	scene.add(sprite);

	sprite.castShadow = true;

	// UPDATING AND MOVING SPRITES
	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, [x, y, z]: Vector3Tuple) {
		tempMatrix.makeScale(100, 100, 100);
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

	const setRandomAnimationAt = (id: number) => {
		const animations = ['fly', 'attack', 'idle', 'death'];
		sprite.animation.setAt(id, animations[Math.floor(Math.random() * animations.length)]);
	};

	function setupRandomAgents() {
		for (let i = 0; i < count; i++) {
			positionX[i] = 0;
			positionY[i] = 0;
			zIndex[i] = -Math.random() * 10;

			speedX[i] = Math.random() * 10;
			speedY[i] = Math.random() * 10 - 5;
			setRandomAnimationAt(i);
			// sprite.animation.setAt(i, bunnies[Math.floor(Math.random() * bunnies.length)]);
		}

		const updateAgents = (delta: number) => {
			for (let i = 0; i < count; i++) {
				delta = 1;
				// timer
				// apply gravity

				// apply velocity
				positionX[i] += speedX[i] * delta * 0.5;
				positionY[i] += speedY[i] * delta * 0.1;

				// roll new behaviour if bunny gets out of bounds

				if (positionX[i] > bounds.right) {
					speedX[i] *= -1;
					positionX[i] = bounds.right;
					setRandomAnimationAt(i);
					sprite.flipX.setAt(i, true);
				} else if (positionX[i] < bounds.left) {
					speedX[i] *= -1;
					positionX[i] = bounds.left;
					setRandomAnimationAt(i);
					sprite.flipX.setAt(i, false);
				}

				if (positionY[i] > bounds.top) {
					speedY[i] *= -0.85;
					positionY[i] = bounds.top;
					setRandomAnimationAt(i);
					if (Math.random() > 0.5) {
						speedY[i] -= Math.random() * 6;
					}
				} else if (positionY[i] < bounds.bottom) {
					setRandomAnimationAt(i);
					speedY[i] *= -1;
					positionY[i] = bounds.top;
				}
			}

			for (let i = 0; i < count; i++) {
				updatePosition(i, [positionX[i], positionY[i], zIndex[i]]);
			}
		};

		return { updateAgents };
	}

	const { updateAgents } = setupRandomAgents();

	const bounds = {
		left: 0,
		right: window.innerWidth,
		bottom: 0,
		top: window.innerHeight
	};

	const update = (delta: number) => {
		updateAgents(delta);

		sprite.update();

		if (dirtyInstanceMatrix) {
			sprite.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
	};

	return { update, sprite };
};
