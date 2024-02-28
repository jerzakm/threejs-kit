import { InstancedSpriteMesh, createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import {
	DoubleSide,
	Matrix4,
	MeshBasicMaterial,
	PointLight,
	type Scene,
	type Vector3Tuple,
	type WebGLRenderer
} from 'three';

export const initSpriteLights = async (renderer: WebGLRenderer, scene: Scene, count: number) => {
	const lightsSheet = await createSpritesheet()
		.add(
			'/spritesDemo/spr_Torch_strip.png',
			{
				type: 'rowColumn',
				width: 6,
				height: 1
			},
			'torch'
		)
		.add(
			'/spritesDemo/spr_FirePlace_strip.png',
			{
				type: 'rowColumn',
				width: 6,
				height: 1
			},
			'fire1'
		)
		.add(
			'/spritesDemo/spr_FirePlace2_strip.png',
			{
				type: 'rowColumn',
				width: 6,
				height: 1
			},
			'fire2'
		)

		.build();

	const baseMaterial = new MeshBasicMaterial({
		transparent: true,
		alphaTest: 0.01,
		side: DoubleSide,
		map: lightsSheet.texture
	});

	const sprite = new InstancedSpriteMesh(baseMaterial, count, renderer, {
		spritesheet: lightsSheet.spritesheet
	});

	sprite.fps = 8;

	sprite.spritesheet = lightsSheet.spritesheet;
	// animationMap.set(ref.animationMap as any)
	sprite.material.needsUpdate = true;

	scene.add(sprite);
	sprite.offset.randomizeAll(100000);

	// UPDATING AND MOVING SPRITES
	let dirtyInstanceMatrix = false;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, position: Vector3Tuple, scale: number = 1) {
		tempMatrix.makeScale(scale, scale, scale);
		tempMatrix.setPosition(...position);
		sprite.setMatrixAt(id, tempMatrix);
		dirtyInstanceMatrix = true;
	}

	const spread = 150;

	for (let i = 0; i < count; i++) {
		const pos: Vector3Tuple = [
			Math.random() ** 2 * spread - spread / 2,
			1.5,
			Math.random() ** 2 * spread - spread / 2
		];

		if (i === 0) {
			pos[0] = 0;
			pos[2] = 0;
		}
		const light = new PointLight('#FFee77', 20, 5, 0.9);
		light.position.set(pos[0], 2, pos[2]);

		scene.add(light);

		updatePosition(i, pos, 3);

		const animations = ['fire1', 'fire2', 'torch'];

		sprite.animation.setAt(i, animations[Math.floor(Math.random() * animations.length)]);
		sprite.playmode.setAt(i, 'FORWARD');
		sprite.loop.setAt(i, true);
	}

	const update = () => {
		sprite.update();

		if (dirtyInstanceMatrix) {
			sprite.instanceMatrix.needsUpdate = true;
			dirtyInstanceMatrix = false;
		}
	};

	return { update, sprite };
};
