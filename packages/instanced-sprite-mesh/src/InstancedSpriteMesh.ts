import {
  BufferGeometry,
  Material,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
  REVISION,
} from "three";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
import {
  SpritesheetFormat,
  constructSpriteMaterial,
  makeDataTexture,
} from "./material";
import { createSpriteTriangle } from "./triangle";
import { initAnimationRunner } from "./animationRunner";
import { Timer } from "./Timer";

type InstancedSpriteOptions = {
  spritesheet?: SpritesheetFormat;
  geometry?: 'quad' | 'tri' | BufferGeometry<any>;
	dietGeometry?: any
};

export const PLAY_MODES = {
  FORWARD: 0,
  REVERSE: 1,
  PAUSE: 2,
  PINGPONG: 3,
} as const;

type PLAY_MODE = keyof typeof PLAY_MODES;

export class InstancedSpriteMesh<
  T extends Material,
  V
> extends InstancedUniformsMesh<T> {
  private _spriteMaterial: ShaderMaterial;
  private _spritesheet?: SpritesheetFormat | undefined;
  private _animationMap: Map<V, number>;
  private _fps: number = 15;
  private _timer: Timer;

  compute: ReturnType<typeof initAnimationRunner>;

  constructor(
    baseMaterial: T,
    count: number,
    renderer: WebGLRenderer,
    options: InstancedSpriteOptions = {
			geometry: 'quad'
		}
  ) {

    let geometry: BufferGeometry<any> | PlaneGeometry;
		if(!options.geometry) options.geometry = 'quad'

		if(options.geometry === 'tri') {
			geometry = createSpriteTriangle();
		}

		if(options.geometry === 'quad') {
			geometry = new PlaneGeometry(1, 1) as any;
		}

		if(options.geometry && typeof options.geometry !== 'string'){
			geometry = options.geometry
		}

    // display material
    const spriteMaterial = constructSpriteMaterial(
      baseMaterial,
      options?.geometry ==='tri'
    );

    super(geometry, spriteMaterial as any, count);

    // TODO revisit later. Temp fix for 159 breaking change
		//@ts-ignore
    if (REVISION >= 159) {
			//@ts-ignore
      this.instanceMatrix.clearUpdateRanges();
			//@ts-ignore
      this.instanceMatrix.addUpdateRange(0, count * 16);
    } else {
      this.instanceMatrix.updateRange.count = count * 16;
    }

    if (this.instanceColor) {
			//@ts-ignore
      if (REVISION >= 159) {
				//@ts-ignore
        this.instanceColor.clearUpdateRanges();
				//@ts-ignore
        this.instanceColor.addUpdateRange(0, count * 3);
      } else {
        this.instanceColor.updateRange.count = count * 3;
      }
    }

    // animation runner - compute, data texture, utils
    this.compute = initAnimationRunner(renderer, count);

    this._spriteMaterial = spriteMaterial as any;
    if (options.spritesheet) this.updateSpritesheet(options.spritesheet);

    this._timer = new Timer();

    this._animationMap = new Map();

    // bind texture from animation runner to the display material
    this._spriteMaterial.uniforms.animationData.value =
      this.compute.gpuCompute.getCurrentRenderTarget(
        this.compute.animationRunner
      ).texture;

    this._spriteMaterial.uniforms.animationDataSize.value =
      this.compute.progressDataTexture.image.width;
  }

  private updateSpritesheet(spritesheet: SpritesheetFormat) {
    const { dataTexture, dataWidth, dataHeight, animMap } =
      makeDataTexture(spritesheet);
    this._spriteMaterial.uniforms.spritesheetData.value = dataTexture;
    this._spriteMaterial.uniforms.dataSize.value.x = dataWidth;
    this._spriteMaterial.uniforms.dataSize.value.y = dataHeight;
    this.compute.animationRunner.material.uniforms["dataSize"].value =
      new Vector2(dataWidth, dataHeight);
    this.compute.animationRunner.material.uniforms["spritesheetData"].value =
      dataTexture;
    // @ts-ignore
    this._animationMap = animMap;
  }

  public get spritesheet(): SpritesheetFormat | undefined {
    return this._spritesheet;
  }

  public set spritesheet(value: SpritesheetFormat) {
    this.updateSpritesheet(value);
    this._spritesheet = value;
  }

  get animationMap(): Map<V, number> | undefined {
    return this._animationMap;
  }

  get animation() {
    return {
      setAt: (instanceId: number, animation: V) => {
        this.compute.utils.updateAnimationAt(
          instanceId,
          this._animationMap.get(animation) || 0
        );
      },
    };
  }

  get frame() {
    return {
      setAt: (instanceId: number, frameId: number, animation?: V) => {
        let id = frameId;
        if (animation) {
          const frameMeta = this.spritesheet?.animations[animation][frameId][0];
          id = frameMeta;
        }
        this.compute.utils.updateFrameAt(instanceId, id);
      },
      unsetAt: (instanceId: number) => {
        this.compute.utils.updateFrameAt(instanceId, -10);
      },
      unsetAll: () => {
        for (let id = 0; id < this.count; id++) {
          this.compute.utils.updateFrameAt(id, -10);
        }
      },
    };
  }

  get playmode() {
    return {
      setAt: (instanceId: number, playmode: PLAY_MODE) => {
        this.compute.utils.updatePlaymodeAt(instanceId, PLAY_MODES[playmode]);
      },
      setAll: (playmode: PLAY_MODE) => {
        for (let i = 0; i < this.count; i++) {
          const isLoop =
            this.compute.progressDataTexture.image.data[i * 4 + 2] >= 10
              ? 10
              : 0;
          this.compute.utils.updatePlaymodeAt(i, isLoop + PLAY_MODES[playmode]);
        }
      },
    };
  }

  get billboarding() {
    return {
      setAt: (instanceId: number, enable: boolean) => {
        this.setUniformAt("billboarding", instanceId, enable ? 1 : 0);
      },
      setAll: (enable: boolean) => {
        this._spriteMaterial.uniforms.billboarding.value = enable ? 1 : 0;
      },
      unsetAll: () => {
        this.unsetUniform("billboarding");
      },
    };
  }

  get offset() {
    return {
      setAt: (instanceId: number, offset: number) => {
        this.compute.utils.updateOffsetAt(instanceId, offset);
      },
      randomizeAll: (scalar: number = 1) => {
        for (let i = 0; i < this.count; i++) {
          this.compute.utils.updateOffsetAt(i, Math.random() * scalar);
        }
      },
    };
  }

  get loop() {
    return {
      setAt: (instanceId: number, loop: boolean) => {
        const playmode =
          this.compute.progressDataTexture.image.data[instanceId * 4 + 2] % 10;
        this.compute.utils.updatePlaymodeAt(
          instanceId,
          playmode + (loop ? 0 : 10)
        );
      },
      setAll: (loop: boolean) => {
        for (let i = 0; i < this.count; i++) {
          const playmode =
            this.compute.progressDataTexture.image.data[i * 4 + 2] % 10;
          this.compute.utils.updatePlaymodeAt(i, playmode + (loop ? 0 : 10));
        }
      },
    };
  }

  get flipX() {
    return {
      setAt: (instanceId: number, flipX: boolean) => {
        this.setUniformAt("flipX", instanceId, flipX ? 1 : 0);
      },
      setGlobal: (flipX: boolean) => {
        this._spriteMaterial.uniforms.flipX.value = flipX ? 1 : 0;
      },
      unsetAll: () => {
        this.unsetUniform("flipX");
      },
    };
  }

  get flipY() {
    return {
      setAt: (instanceId: number, flipY: boolean) => {
        this.setUniformAt("flipY", instanceId, flipY ? 1 : 0);
      },
      setGlobal: (flipY: boolean) => {
        this._spriteMaterial.uniforms.flipY.value = flipY ? 1 : 0;
      },
      unsetAll: () => {
        this.unsetUniform("flipY");
      },
    };
  }

  play(animation: V, loop: boolean = true, playmode: PLAY_MODE = "FORWARD") {
    return {
      at: (instanceId: number) => {
        this.compute.utils.updateAnimationAt(
          instanceId,
          this._animationMap.get(animation) || 0
        );

        this.compute.utils.updatePlaymodeAt(
          instanceId,
          PLAY_MODES[playmode] + (loop ? 0 : 10)
        );
      },
    };
  }

  /** HSV shift tinting */
  get hueShift() {
    /**
     * todo - reuse vector4 or something
     */
    const tVector = new Vector4();
    return {
      // TODO - per instance tinting doesnt work - artifacts
      // setAt: (
      //   instanceId: number,
      //   tint?: { h: number; s: number; v: number }
      // ) => {
      //   if (tint) {
      //     tVector.set(tint.h, tint.s, tint.v, 1);
      //   } else {
      //     tVector.setW(0);
      //   }
      //   this.setUniformAt("tint", instanceId, tVector);
      // },
      setGlobal: (tint?: { h: number; s: number; v: number }) => {
        if (tint) {
          tVector.set(tint.h, tint.s, tint.v, 1);
        } else {
          tVector.setW(0);
        }
        this._spriteMaterial.uniforms.tint.value = tVector;
      },
      // unsetAll: () => {
      //   this.unsetUniform("tint");
      // },
    };
  }

  public get fps(): number {
    return this._fps;
  }

  public set fps(value: number) {
    this._fps = value;
    this.compute.animationRunner.material.uniforms["fps"].value = value;
  }

  public update() {
    this._timer.update();
    const dt = this._timer.getDelta();
    this.compute.animationRunner.material.uniforms["deltaTime"].value = dt;

    this.compute.update();
  }
}
