import type { SpritesheetFormat } from '@threejs-kit/instanced-sprite-mesh';
import {
	CanvasTexture,
	ImageLoader,
	NearestFilter,
	RepeatWrapping,
	SRGBColorSpace,
	Texture
} from 'three';

type AnimationDefitinion = {
	name: string;
	imageUrl: string;
	custom?: SpritesheetFormat['frames'];
	auto?: {
		type: 'rowColumn' | 'frame';
		w: number;
		h: number;
		rowMajor: boolean;
	};
};

export class SpriteBuilder {
	private imageLoader: ImageLoader;
	private animations: AnimationDefitinion[];

	constructor() {
		this.imageLoader = new ImageLoader();
		this.animations = [];
		//
	}

	add(
		name: string = 'default',
		imageUrl: string,
		config: {
			type: 'rowColumn' | ' frame';
			w: number;
			h: number;
			rowMajor: boolean;
		}
	) {
		const animation: AnimationDefitinion = {
			name,
			imageUrl
		};

		if (config.type == 'rowColumn') {
			animation['auto'] = {
				type: 'rowColumn',
				w: config.w,
				h: config.h,
				rowMajor: config.rowMajor
			};
		}

		this.animations.push(animation);
		return this;
	}

	async build() {
		const imgLoader = new ImageLoader();

		console.log(this.animations);

		const generatedSpritesheet: SpritesheetFormat = {
			frames: [],
			animations: {},
			sheetSize: [0, 0],
			animationLengths: []
		};

		let texture = new Texture();

		const images: { img: HTMLImageElement; w: number; h: number }[] = [];

		let generatedWidth = 0;
		let generatedHeight = 0;

		for (const anim of this.animations) {
			const img = await imgLoader.loadAsync(anim.imageUrl);
			const w = img.width;
			const h = img.height;
			generatedWidth = Math.max(generatedWidth, w);
			generatedHeight += h;
			images.push({
				img,
				w,
				h
			});
		}

		if (this.animations.length === 0) {
			// texture.image = images[0].img;
		} else {
			//
		}

		const canvas = document.createElement('canvas');
		canvas.width = generatedWidth;
		canvas.height = generatedHeight;

		const debugDiv = document.createElement('div');
		debugDiv.style.backgroundColor = 'grey';
		debugDiv.style.position = 'fixed';
		debugDiv.style.top = '0px';
		debugDiv.style.left = '0px';
		debugDiv.style.zIndex = '50';
		debugDiv.style.transform = 'scale(0.5,0.5)';
		debugDiv.style.transformOrigin = 'left';
		// debugDiv.style.scale = '50%';

		debugDiv.appendChild(canvas);
		document.body.appendChild(debugDiv);

		const context = canvas.getContext('2d');

		let y = 0;
		for (const { img, h } of images) {
			context?.drawImage(img, 0, y, img.width, img.height);
			y += h;
		}

		texture = new CanvasTexture(canvas);

		// texture.image = img;
		texture.needsUpdate = true;

		let animIndex = 0;
		let frameCounter = 0;
		let accumulatedHeight = 0;

		for (const a of this.animations) {
			const img = images[animIndex];

			let framesCount = 0;

			const imgPartialW = img.w;
			const imgPartialH = img.h;

			if (a.auto) {
				if (a.auto.type == 'rowColumn') {
					accumulatedHeight += imgPartialH;
					framesCount = a.auto.w * a.auto.h;
					generatedSpritesheet.animations[a.name] = [];
					for (let x = 0; x < a.auto.w; x++) {
						for (let y = 0; y < a.auto.h; y++) {
							generatedSpritesheet.frames.push([
								((img.w / framesCount) * x) / generatedWidth,
								1 - accumulatedHeight / generatedHeight,
								imgPartialW / framesCount / generatedWidth,
								imgPartialH / generatedHeight
							]);
							generatedSpritesheet.animations[a.name].push([frameCounter, 1]);
							frameCounter++;
						}
					}
				}

				generatedSpritesheet.animationLengths.push(framesCount);
			}
			animIndex++;
		}

		texture.matrixAutoUpdate = false;
		texture.generateMipmaps = false;
		texture.premultiplyAlpha = false;
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.magFilter = texture.minFilter = NearestFilter;
		texture.colorSpace = SRGBColorSpace;

		generatedSpritesheet.sheetSize = [generatedWidth, generatedHeight];

		console.log({ generatedSpritesheet });

		return { spritesheet: generatedSpritesheet, texture };
	}
}
