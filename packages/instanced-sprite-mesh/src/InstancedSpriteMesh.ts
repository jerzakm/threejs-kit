import {
  Material,
  type BufferGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  ShaderMaterial,
} from "three";
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
  T extends Material
> extends InstancedUniformsMesh<T> {
  private _spriteMaterial: ShaderMaterial;
  private _spritesheet?: SpritesheetFormat | undefined;
  private _animationMap: Map<string, number>;

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

  get animationMap(): Map<string, number> | undefined {
    return this._animationMap;
  }
}
