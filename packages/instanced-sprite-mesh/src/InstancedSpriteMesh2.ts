import { createRadixSort, InstancedMesh2 } from '@three.ez/instanced-mesh'

import { PlaneGeometry, Vector2, Vector4, WebGLRenderer } from 'three'
import { initAnimationRunner } from './animationRunner'
import { makeDataTexture, SpritesheetFormat } from './material'
import { patchSpriteMaterial } from './material2'
import { Timer } from './Timer'

export const PLAY_MODES = {
  FORWARD: 0,
  REVERSE: 1,
  PAUSE: 2,
  PINGPONG: 3
} as const

type PLAY_MODE = keyof typeof PLAY_MODES

export class InstancedSpriteMesh2<V> extends InstancedMesh2 {
  private _spritesheet: SpritesheetFormat
  private _animationMap: Map<V, number>
  private _fps: number = 15
  private _timer: Timer
  private _updateShader: any
  compute: ReturnType<typeof initAnimationRunner>

  constructor(
    baseMaterial: any,
    count: number,
    renderer: WebGLRenderer,
    spritesheet: SpritesheetFormat
  ) {
    // const patched = patchSpriteMaterial(baseMaterial)
    const patched = patchSpriteMaterial(baseMaterial)
    super(renderer, count, new PlaneGeometry(), patched)

    this._timer = new Timer()
    this.compute = initAnimationRunner(renderer, count)

    const { dataTexture, dataWidth, dataHeight, animMap } = makeDataTexture(spritesheet)

    this.compute.animationRunner.material.uniforms['dataSize'].value = new Vector2(
      dataWidth,
      dataHeight
    )
    this.compute.animationRunner.material.uniforms['spritesheetData'].value = dataTexture
    // @ts-ignore
    this._animationMap = animMap
    this._spritesheet = spritesheet

    this._updateShader = () => {
      if (this.material.userData.shader) {
        this.material.userData.shader.uniforms.time.value = performance.now()
        this.material.userData.shader.uniforms.spritesheetData.value = dataTexture
        this.material.userData.shader.uniforms.dataSize.value.x = dataWidth
        this.material.userData.shader.uniforms.dataSize.value.y = dataHeight
        this.material.userData.shader.uniforms.animationData.value =
          this.compute.gpuCompute.getCurrentRenderTarget(this.compute.animationRunner).texture
        this.material.userData.shader.uniforms.animationDataSize.value =
          this.compute.progressDataTexture.image.width
      }
    }

    // this.sortObjects = true
    // this.customSort = createRadixSort(this)
    this.perObjectFrustumCulled = false
  }

  public get spritesheet(): SpritesheetFormat | undefined {
    return this._spritesheet
  }

  get animationMap(): Map<V, number> | undefined {
    return this._animationMap
  }

  get animation() {
    return {
      setAt: (instanceId: number, animation: V) => {
        this.compute.utils.updateAnimationAt(instanceId, this._animationMap.get(animation) || 0)
      }
    }
  }

  get frame() {
    return {
      setAt: (instanceId: number, frameId: number, animation?: V) => {
        let id = frameId
        if (animation) {
          const frameMeta = this.spritesheet.animations[animation][frameId][0]
          id = frameMeta
        }
        this.compute.utils.updateFrameAt(instanceId, id)
      },
      unsetAt: (instanceId: number) => {
        this.compute.utils.updateFrameAt(instanceId, -10)
      },
      unsetAll: () => {
        for (let id = 0; id < this.count; id++) {
          this.compute.utils.updateFrameAt(id, -10)
        }
      }
    }
  }

  get playmode() {
    return {
      setAt: (instanceId: number, playmode: PLAY_MODE) => {
        this.compute.utils.updatePlaymodeAt(instanceId, PLAY_MODES[playmode])
      },
      setAll: (playmode: PLAY_MODE) => {
        for (let i = 0; i < this.count; i++) {
          const isLoop = this.compute.progressDataTexture.image.data[i * 4 + 2] >= 10 ? 10 : 0
          this.compute.utils.updatePlaymodeAt(i, isLoop + PLAY_MODES[playmode])
        }
      }
    }
  }

  get billboarding() {
    return {
      setAt: (instanceId: number, enable: boolean) => {
        // this.setUniformAt("billboarding", instanceId, enable ? 1 : 0);
      },
      setAll: (enable: boolean) => {
        // this._spriteMaterial.uniforms.billboarding.value = enable ? 1 : 0;
      },
      unsetAll: () => {
        // this.unsetUniform("billboarding");
      }
    }
  }

  get offset() {
    return {
      setAt: (instanceId: number, offset: number) => {
        this.compute.utils.updateOffsetAt(instanceId, offset)
      },
      randomizeAll: (scalar: number = 1) => {
        for (let i = 0; i < this.count; i++) {
          this.compute.utils.updateOffsetAt(i, Math.random() * scalar)
        }
      }
    }
  }

  get loop() {
    return {
      setAt: (instanceId: number, loop: boolean) => {
        const playmode = this.compute.progressDataTexture.image.data[instanceId * 4 + 2] % 10
        this.compute.utils.updatePlaymodeAt(instanceId, playmode + (loop ? 0 : 10))
      },
      setAll: (loop: boolean) => {
        for (let i = 0; i < this.count; i++) {
          const playmode = this.compute.progressDataTexture.image.data[i * 4 + 2] % 10
          this.compute.utils.updatePlaymodeAt(i, playmode + (loop ? 0 : 10))
        }
      }
    }
  }

  get flipX() {
    return {
      setAt: (instanceId: number, flipX: boolean) => {
        // this.setUniformAt("flipX", instanceId, flipX ? 1 : 0);
      },
      setGlobal: (flipX: boolean) => {
        // this._spriteMaterial.uniforms.flipX.value = flipX ? 1 : 0;
      },
      unsetAll: () => {
        // this.unsetUniform("flipX");
      }
    }
  }

  get flipY() {
    return {
      setAt: (instanceId: number, flipY: boolean) => {
        // this.setUniformAt("flipY", instanceId, flipY ? 1 : 0);
      },
      setGlobal: (flipY: boolean) => {
        // this._spriteMaterial.uniforms.flipY.value = flipY ? 1 : 0;
      },
      unsetAll: () => {
        // this.unsetUniform("flipY");
      }
    }
  }

  play(animation: V, loop: boolean = true, playmode: PLAY_MODE = 'FORWARD') {
    return {
      at: (instanceId: number) => {
        this.compute.utils.updateAnimationAt(instanceId, this._animationMap.get(animation) || 0)

        this.compute.utils.updatePlaymodeAt(instanceId, PLAY_MODES[playmode] + (loop ? 0 : 10))
      }
    }
  }

  /** HSV shift tinting */
  get hueShift() {
    /**
     * todo - reuse vector4 or something
     */
    const tVector = new Vector4()
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
          tVector.set(tint.h, tint.s, tint.v, 1)
        } else {
          tVector.setW(0)
        }
        // this._spriteMaterial.uniforms.tint.value = tVector;
      }
      // unsetAll: () => {
      //   this.unsetUniform("tint");
      // },
    }
  }

  public get fps(): number {
    return this._fps
  }

  public set fps(value: number) {
    this._fps = value
    this.compute.animationRunner.material.uniforms['fps'].value = value
  }

  public update() {
    this._timer.update()
    const dt = this._timer.getDelta()
    this.compute.animationRunner.material.uniforms['deltaTime'].value = dt
    this._updateShader()
    this.compute.update()
  }
}
