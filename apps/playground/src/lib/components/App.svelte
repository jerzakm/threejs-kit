<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Renderer from './Renderer.svelte';
</script>

<div>
	<Canvas>
		<Renderer />
		<slot />
	</Canvas>
</div>

<style>
	div {
		width: 100vw;
		height: 100vh;
		position: fixed;
		top: 0;
		left: 0;
	}
</style>
