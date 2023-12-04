<script lang="ts">
	import { T, useFrame } from '@threlte/core';
	import { DoubleSide, RawShaderMaterial } from 'three';

	export let texture: any;

	const vertex = `
    precision mediump float;
    precision mediump int;

    uniform mat4 modelViewMatrix; // optional
    uniform mat4 projectionMatrix; // optional

    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 uv;

    varying vec3 vPosition;
    varying vec4 vColor;
    varying vec2 vUv;

    void main()	{

      vPosition = position;
      vColor = color;

      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

	const frag = `
  
    precision mediump float;
    precision mediump int;

    varying vec3 vPosition;
    varying vec4 vColor;
    varying vec2 vUv;

    uniform sampler2D tex;

    void main()	{

      vec4 color = vec4( vUv, 0.,1. );      
      // gl_FragColor = color;
      gl_FragColor = texture2D(tex, vUv);
    }
`;

	const material = new RawShaderMaterial({
		fragmentShader: frag,
		vertexShader: vertex,
		side: DoubleSide,
		uniforms: {
			tex: { value: null }
		}
	});

	$: {
		if (texture) {
			material.uniforms.tex.value = texture;
			material.needsUpdate = true;
		}
	}

	let j = 0;
</script>

<T is={material} />
