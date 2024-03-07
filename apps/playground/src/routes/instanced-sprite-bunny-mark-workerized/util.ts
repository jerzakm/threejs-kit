import { NearestFilter, SRGBColorSpace, TextureLoader } from 'three';

const loader = new TextureLoader();

export const loadTexture = (url: string) => {
	const texture = loader.load(url);
	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
	texture.colorSpace = SRGBColorSpace;

	return texture;
};
