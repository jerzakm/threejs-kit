# @three-kit/materials

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
