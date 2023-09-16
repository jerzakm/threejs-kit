---
"@threejs-kit/materials": patch
---

new `cutEdges` parameter for `MeshParallaxMaterial`. Indicates whether to trim the edges of the geometry when the parallaxed UV coordinates exceed the value of 1. If set to true, any portions of the material where the parallaxed UV coordinates go beyond the limit wil get clipped producing a jagged look at the edge.
