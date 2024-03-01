import { InstancedSpriteMesh, createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import {
	DoubleSide,
	Matrix4,
	MeshStandardMaterial,
	Vector2,
	type Scene,
	type Vector3Tuple,
	type WebGLRenderer
} from 'three';

export const initSpriteHounds = async (renderer: WebGLRenderer, scene: Scene, count: number) => {
	// INSTANCED SPRITE SETUP

	// const texture = new TextureLoader().load('/textures/sprites/player.png');
	// texture.minFilter = NearestFilter;
	// texture.magFilter = NearestFilter;
	// texture.colorSpace = SRGBColorSpace;

	const { texture, spritesheet } = await createSpritesheet()
		.add(
			'/spritesDemo/hell-hound-idle.png',
			{
				type: 'rowColumn',
				width: 6,
				height: 1
			},
			'idle'
		)
		.add(
			'/spritesDemo/hell-hound-jump.png',
			{
				type: 'rowColumn',
				width: 6,
				height: 1
			},
			'jump'
		)
		.add(
			'/spritesDemo/hell-hound-run.png',
			{
				type: 'rowColumn',
				width: 5,
				height: 1
			},
			'run'
		)
		.add(
			'/spritesDemo/hell-hound-walk.png',
			{
				type: 'rowColumn',
				width: 12,
				height: 1
			},
			'walk'
		)
		.build();

	const baseMaterial = new MeshStandardMaterial({
		transparent: true,
		alphaTest: 0.01,
		// needs to be double side for shading
		side: DoubleSide,
		map: texture
	});

	const sprite = new InstancedSpriteMesh(baseMaterial, count, renderer);
	sprite.fps = 7;

	sprite.spritesheet = spritesheet;
	scene.add(sprite);

	sprite.castShadow = true;

	// UPDATING AND MOVING SPRITES
	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, position: Vector3Tuple) {
		tempMatrix.makeScale(4, 2, 1);
		tempMatrix.setPosition(...position);
		sprite.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	}

	const posX: number[] = new Array(count).fill(0);
	const posZ: number[] = new Array(count).fill(0);

	type Agent = {
		action: 'idle' | 'run' | 'walk' | 'jump';
		velocity: [number, number];
		timer: number;
	};

	const agents: Agent[] = [];

	const { updateAgents } = setupRandomAgents();

	function setupRandomAgents() {
		const spread = 400;
		const minCenterDistance = 0;
		const maxCenterDistance = spread;
		const rndPosition: any = () => {
			const x = Math.random() * spread - spread / 2;
			const y = Math.random() * spread - spread;

			if (Math.sqrt(x ** 2 + y ** 2) < minCenterDistance) {
				return rndPosition();
			}

			return { x, y };
		};

		for (let i = 0; i < count; i++) {
			const pos = rndPosition();
			posX[i] = pos.x;
			posZ[i] = pos.y;
		}

		for (let i = 0; i < count; i++) {
			agents.push({
				action: 'run',
				timer: 0.1,
				velocity: [0, 1]
			});
		}

		const pickAction = () => {
			const actionRoll = Math.random();
			if (actionRoll > 0.95) return 'jump';
			if (actionRoll > 0.7) return 'idle';
			if (actionRoll > 0.5) return 'run';
			return 'walk';
		};

		const velocityHelper = new Vector2(0, 0);

		const RUN_SPEED = 4;
		const WALK_SPEED = 0.8;

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
						const pickedAction = pickAction() satisfies Agent['action'];

						agents[i].action = pickedAction;
						agents[i].timer = 5 + Math.random() * 5;

						if (agents[i].action === 'run') {
							velocityHelper
								.set(Math.random() - 0.5, Math.random() - 0.5)
								.normalize()
								.multiplyScalar(RUN_SPEED);
							agents[i].velocity = velocityHelper.toArray();
							sprite.play('run', true, 'FORWARD').at(i);
							sprite.flipX.setAt(i, velocityHelper.x > 0);
						}

						if (agents[i].action === 'walk') {
							velocityHelper
								.set(Math.random() - 0.5, Math.random() - 0.5)
								.normalize()
								.multiplyScalar(WALK_SPEED);
							agents[i].velocity = velocityHelper.toArray();
							sprite.play('walk', true, 'FORWARD').at(i);
							sprite.flipX.setAt(i, velocityHelper.x > 0);
						}

						if (agents[i].action === 'jump') {
							velocityHelper
								.set(Math.random() - 0.5, Math.random() - 0.5)
								.normalize()
								.multiplyScalar(RUN_SPEED * 1.5);
							agents[i].velocity = velocityHelper.toArray();
							sprite.play('jump', true, 'FORWARD').at(i);
							sprite.flipX.setAt(i, velocityHelper.x > 0);
						}

						if (agents[i].action === 'idle') {
							sprite.play('idle', true, 'FORWARD').at(i);
							agents[i].velocity = [0, 0];
						}
					}
				}
			}

			for (let i = 0; i < count; i++) {
				updatePosition(i, [posX[i] || 0, 1, posZ[i] || 0]);
			}
		};

		return { updateAgents };
	}

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
