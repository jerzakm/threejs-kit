import { Material, PlaneGeometry, ShaderMaterial } from "three";
import { InstancedUniformsMesh } from "three-instanced-uniforms-mesh";
import {
  SpritesheetFormat,
  constructSpriteMaterial,
  makeDataTexture,
} from "./material";

type InstancedSpriteOptions = {
  // geometry?: BufferGeometry
};

export class InstancedSpriteMesh<
  T extends Material,
  V
> extends InstancedUniformsMesh<T> {
  private _spriteMaterial: ShaderMaterial;
  private _spritesheet?: SpritesheetFormat | undefined;
  private _animationMap: Map<V, number>;
  private _time: number = 0;

  constructor(
    baseMaterial: T,
    count: number,
    spritesheet?: SpritesheetFormat,
    options?: InstancedSpriteOptions
  ) {
    const geometry = new PlaneGeometry(1, 1);
    const spriteMaterial = constructSpriteMaterial(baseMaterial);
    super(geometry, spriteMaterial as any, count);

    this._animationMap = new Map();
    this._spriteMaterial = spriteMaterial as any;
    if (spritesheet) this.updateSpritesheet(spritesheet);
  }

  private updateSpritesheet(spritesheet: SpritesheetFormat) {
    const { dataTexture, dataWidth, dataHeight, animMap } =
      makeDataTexture(spritesheet);
    this._spriteMaterial.uniforms.spritesheetData.value = dataTexture;
    this._spriteMaterial.uniforms.dataSize.value.x = dataWidth;
    this._spriteMaterial.uniforms.dataSize.value.y = dataHeight;
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
        this._spriteMaterial.uniforms.animationId.value =
          this._animationMap.get(animation) || 0;

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

  public get time(): number {
    return this._time;
  }

  public set time(value: number) {
    this._spriteMaterial.uniforms.time.value = value;
    this._time = value;
  }

  public updateTime() {
    const value = performance.now() * 0.001;
    this._spriteMaterial.uniforms.time.value = value;
    this._time = value;
  }
}
