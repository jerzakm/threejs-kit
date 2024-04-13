# @three-kit/materials

## 2.4.7

### Patch Changes

- 437b867: update package.json, move dependencies from peer&dev to dependencies

## 2.4.6

### Patch Changes

- e98dbb5: Apple bugfix #2 - HalfFloat back to Float

## 2.4.3

### Patch Changes

- 475a348: three-instanced-uniforms-mesh as peer

## 2.4.2

### Patch Changes

- 4121a83: corrected spritebuilder frameRange

## 2.4.1

### Patch Changes

- db54522: freeze frame bugfix

## 2.4.0

### Minor Changes

- 2a58cde: Allow setting a given frameID per instance with .frame.setAt

## 2.3.4

### Patch Changes

- 75cfd6c: rename w and h to width and height

## 2.3.3

### Patch Changes

- a8aac5e: Externalize threejs

## 2.3.2

### Patch Changes

- 73ce88d: three bump

## 2.3.1

### Patch Changes

- 41898f2: compatibility fix for three>159

## 2.3.0

### Minor Changes

- bea058a: sprites correctly scale when billboarded

## 2.2.0

### Minor Changes

- 12bc029: sprite builder utility fix for 'frameSize' autoframing option

## 2.1.1

### Patch Changes

- 5ef119f: shader fix for flip

## 2.1.0

### Minor Changes

- 2de01f0: mesh.flipX.at() function fixed. Removed console .logs

## 2.0.0

### Major Changes

- 848a412: Per instnace granular animation controls with GPGPU

### Minor Changes

- ace70f5: updated sprite builder to support multiple animations per spritesheet image file

### Patch Changes

- 0cb6e5c: bugfix: corrected center point of a zoom when using triangle geometry (glsl)

## 1.2.0

### Minor Changes

- 55c1caa: Option to use a triangle instead of a plane for the sprite geometry
- 9071d46: - flipY and flipX for sprites
  - offset animations by time (random or set)

## 1.1.0

### Minor Changes

- a29f901: createSpritesheet utility function for combining multiple image files into one and generating metadata for instancing

## 1.0.0

### Major Changes

- 990d63b: instanced sprites wip

### Minor Changes

- 296a668: Docs sketch for sprites, fps setter

## 1.1.1

### Patch Changes

- f0da89e: new `cutEdges` parameter for `MeshParallaxMaterial`. Indicates whether to trim the edges of the geometry when the parallaxed UV coordinates exceed the value of 1. If set to true, any portions of the material where the parallaxed UV coordinates go beyond the limit wil get clipped producing a jagged look at the edge.

## 1.1.0

### Minor Changes

- 03e43e2: New material MeshGlintMaterial. Early release - needs major improvements.

### Patch Changes

- ad89c00: MeshParallaxMaterial - better quality at angles approaching 90°

## 1.0.8

### Patch Changes

- e78da3d: MeshParallaxMaterial fixes - constructor

## 1.0.7

### Patch Changes

- 5ef828c: another release action test

## 1.0.6

### Patch Changes

- e059ce8: release attempt..

## 1.0.5

### Patch Changes

- 98016fd: yet another build try

## 1.0.4

### Patch Changes

- d2597e4: publish attempt..

## 1.0.3

### Patch Changes

- 11cd80e: publish overrides

## 1.0.2

### Patch Changes

- 8881893: fixing build

## 1.0.1

### Patch Changes

- 2d0d30b: build test

## 2.0.0

### Major Changes

- d81b498: Parallax Occlusion material based on MeshPhysicalMaterial
