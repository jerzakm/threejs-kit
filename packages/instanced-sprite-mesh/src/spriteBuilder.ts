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
  multiAnimations?: { name: string; frameRange: [from: number, to: number] }[];
};

// meta is either a string - name of a single animation, or an array of names + framerange
type AnimationMeta =
  | { name: string; frameRange: [from: number, to: number] }[]
  | string;

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
    imageUrl: string,
    config: {
      type: "rowColumn" | "frameSize";
      w: number;
      h: number;
      name?: string;
    },
    meta: AnimationMeta
  ) {
    const animation: AnimationDefitinion = {
      name: "",
      imageUrl,
    };

    if (Array.isArray(meta)) {
      animation.multiAnimations = meta;
    } else {
      animation.name = meta;
    }

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
        const imgPartialW = img.w / columns;
        const imgPartialH = img.h / rows;

        // TODO ROW MAJOR / COLUMN MAJOR STUFF

        framesCount = rows * columns;

        if (!a.multiAnimations) {
          spritesheet.animations[a.name] = [];
        }

        const frameMap: Map<number, number> = new Map();

        for (let y = 0; y < rows; y++) {
          accumulatedHeight += imgPartialH;
          for (let x = 0; x < columns; x++) {
            spritesheet.frames.push([
              ((img.w / columns) * x) / generatedWidth,
              1 - accumulatedHeight / generatedHeight,
              imgPartialW / generatedWidth,
              imgPartialH / generatedHeight,
            ]);
            if (a.multiAnimations) {
              const id = y * columns + x;
              // local to global id
              frameMap.set(id, frameCounter);
            } else {
              spritesheet.animations[a.name].push([frameCounter, 1]);
            }
            frameCounter++;
          }
        }

        if (a.multiAnimations) {
          for (const anim of a.multiAnimations) {
            spritesheet.animations[anim.name] = [];
            spritesheet.animationLengths.push(
              anim.frameRange[1] - anim.frameRange[0]
            );
            for (
              let frame = anim.frameRange[0];
              frame < anim.frameRange[1];
              frame++
            ) {
              spritesheet.animations[anim.name].push([frameMap.get(frame), 1]);
            }
          }
        } else {
          spritesheet.animationLengths.push(framesCount);
        }
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
    return { spritesheet, texture };
  }
}
