import { InstancedSpriteMesh, createSpritesheet } from '@threejs-kit/instanced-sprite-mesh';
import {
	DoubleSide,
	Matrix4,
	MeshBasicMaterial,
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

	const sprite = new InstancedSpriteMesh(baseMaterial, count, renderer);

	sprite.fps = 1;

	sprite.spritesheet = spritesheet;
	scene.add(sprite);

	sprite.castShadow = true;

	const tempMatrix = new Matrix4();
	function updatePosition(id: number, [x, y, z]: Vector3Tuple) {
		tempMatrix.makeScale(25, 32, 1);
		tempMatrix.setPosition(x, bounds.top - y, z);
		sprite.setMatrixAt(id, tempMatrix);
		// dirtyInstanceMatrix = true;
	}
	const bounds = {
		left: 0,
		right: window.innerWidth,
		bottom: 0,
		top: window.innerHeight
	};

	for (let i = 0; i < count; i++) {
		sprite.animation.setAt(i, bunnies[Math.floor(Math.random() * bunnies.length)]);
	}

	return { sprite, updatePosition };
};
