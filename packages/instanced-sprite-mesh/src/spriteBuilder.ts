import {
  CanvasTexture,
  ImageLoader,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
} from "three";
import { SpritesheetFormat } from "./material";

type AnimationDefitinion = {
  name: string;
  imageUrl: string;
  custom?: SpritesheetFormat["frames"];
  auto?: {
    type: "rowColumn" | "frameSize";
    w: number;
    h: number;
    // rowMajor: boolean;
  };
};

export const createSpritesheet = () => {
  return new SpriteBuilder();
};

class SpriteBuilder {
  private animations: AnimationDefitinion[];

  constructor() {
    this.animations = [];
    //
  }

  add(
    name: string = "default",
    imageUrl: string,
    config: {
      type: "rowColumn" | "frameSize";
      w: number;
      h: number;
      // rowMajor: boolean;
    }
  ) {
    const animation: AnimationDefitinion = {
      name,
      imageUrl,
    };

    if (config.type == "rowColumn") {
      animation["auto"] = {
        type: "rowColumn",
        w: config.w,
        h: config.h,
      };
    }

    this.animations.push(animation);
    return this;
  }

  async build() {
    const imgLoader = new ImageLoader();

    console.log(this.animations);

    const spritesheet: SpritesheetFormat = {
      frames: [],
      animations: {},
      sheetSize: [0, 0],
      animationLengths: [],
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
        h,
      });
    }

    if (this.animations.length === 0) {
      // texture.image = images[0].img;
    } else {
      //
    }

    const canvas = document.createElement("canvas");
    canvas.width = generatedWidth;
    canvas.height = generatedHeight;

    const context = canvas.getContext("2d");

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
        let rows = 0;
        let columns = 0;

        if (a.auto.type == "frameSize") {
          columns = img.w / a.auto.w;
          rows = img.h / a.auto.h;
        }
        if (a.auto.type == "rowColumn") {
          columns = a.auto.w;
          rows = a.auto.h;
        }

        // TODO ROW MAJOR / COLUMN MAJOR STUFF

        accumulatedHeight += imgPartialH;
        framesCount = rows * columns;
        spritesheet.animations[a.name] = [];

        for (let x = 0; x < columns; x++) {
          for (let y = 0; y < rows; y++) {
            spritesheet.frames.push([
              ((img.w / framesCount) * x) / generatedWidth,
              1 - accumulatedHeight / generatedHeight,
              imgPartialW / framesCount / generatedWidth,
              imgPartialH / generatedHeight,
            ]);
            spritesheet.animations[a.name].push([frameCounter, 1]);
            frameCounter++;
          }
        }

        spritesheet.animationLengths.push(framesCount);
      }
      animIndex++;
    }

    texture.matrixAutoUpdate = false;
    texture.generateMipmaps = false;
    texture.premultiplyAlpha = false;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.magFilter = texture.minFilter = NearestFilter;
    texture.colorSpace = SRGBColorSpace;

    spritesheet.sheetSize = [generatedWidth, generatedHeight];

    console.log({ generatedSpritesheet: spritesheet });

    return { spritesheet, texture };
  }
}
