import {
  BufferGeometry,
  Material,
  PlaneGeometry,
  ShaderMaterial,
  Vector4,
} from "three";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
import {
  SpritesheetFormat,
  constructSpriteMaterial,
  makeDataTexture,
} from "./material";
import { createSpriteTriangle } from "./triangle";

type InstancedSpriteOptions = {
  spritesheet?: SpritesheetFormat;
  triGeometry?: boolean;
};

export class InstancedSpriteMesh<
  T extends Material,
  V
> extends InstancedUniformsMesh<T> {
  private _spriteMaterial: ShaderMaterial;
  private _spritesheet?: SpritesheetFormat | undefined;
  private _animationMap: Map<V, number>;
  private _time: number = 0;
  private _fps: number = 15;

  constructor(
    baseMaterial: T,
    count: number,
    options: InstancedSpriteOptions = {}
  ) {
    let geometry: BufferGeometry<any> | PlaneGeometry;

    if (options?.triGeometry) {
      console.log("tri geo");
      geometry = createSpriteTriangle();
    } else {
      geometry = new PlaneGeometry(1, 1) as any;
    }

    const spriteMaterial = constructSpriteMaterial(
      baseMaterial,
      options?.triGeometry
    );
    super(geometry, spriteMaterial as any, count);

    this._animationMap = new Map();
    this._spriteMaterial = spriteMaterial as any;
    if (options.spritesheet) this.updateSpritesheet(options.spritesheet);
  }

  private updateSpritesheet(spritesheet: SpritesheetFormat) {
    const { dataTexture, dataWidth, dataHeight, animMap } =
      makeDataTexture(spritesheet);
    this._spriteMaterial.uniforms.spritesheetData.value = dataTexture;
    this._spriteMaterial.uniforms.dataSize.value.x = dataWidth;
    this._spriteMaterial.uniforms.dataSize.value.y = dataHeight;
    // @ts-ignore
    // todo type this with named animations?
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
        this.setUniformAt(
          "animationId",
          instanceId,
          this._animationMap.get(animation) || 0
        );

        this.setUniformAt("startTime", instanceId, performance.now() * 0.001);
      },
      setGlobal: (animation: V) => {
        const animIndex = this._animationMap.get(animation) || 0;
        this._spriteMaterial.uniforms.animationId.value = animIndex;

        this._spriteMaterial.uniforms.startTime.value =
          performance.now() * 0.001;
      },
      resetInstances: () => {
        this.unsetUniform("animationId");
      },
    };
  }

  get billboarding() {
    return {
      setAt: (instanceId: number, enable: boolean) => {
        this.setUniformAt("billboarding", instanceId, enable ? 1 : 0);
      },
      setGlobal: (enable: boolean) => {
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
        this.setUniformAt("offset", instanceId, offset);
      },
      randomizeAll: (scalar: number = 1) => {
        for (let i = 0; i < this.count; i++) {
          // todo benchmark and optimize?
          this.setUniformAt("offset", i, Math.random() * scalar);
        }
      },
      unsetAll: () => {
        this.unsetUniform("billboarding");
      },
    };
  }

  get loop() {
    return {
      setAt: (instanceId: number, loop: boolean) => {
        this.setUniformAt("loop", instanceId, loop ? 1 : 0);
      },
      setGlobal: (loop: boolean) => {
        this._spriteMaterial.uniforms.loop.value = loop ? 1 : 0;
      },
      unsetAll: () => {
        this.unsetUniform("loop");
      },
    };
  }

  get flipX() {
    return {
      setAt: (instanceId: number, flipX: boolean) => {
        this.setUniformAt("loop", instanceId, flipX ? 1 : 0);
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

  play(animation: V, loop: boolean = true) {
    return {
      at: (instanceId: number) => {
        this.loop.setAt(instanceId, loop);
        this.animation.setAt(instanceId, animation);
      },
      global: () => {
        this.loop.setGlobal(loop);
        this.animation.setGlobal(animation);
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

  public get time(): number {
    return this._time;
  }

  public set time(value: number) {
    this._spriteMaterial.uniforms.time.value = value;
    this._time = value;
  }

  public get fps(): number {
    return this._fps;
  }

  public set fps(value: number) {
    this._spriteMaterial.uniforms.fps.value = value;
    this._fps = value;
  }

  public updateTime() {
    const value = performance.now() * 0.001;
    this._spriteMaterial.uniforms.time.value = value;
    this._time = value;
  }
}
