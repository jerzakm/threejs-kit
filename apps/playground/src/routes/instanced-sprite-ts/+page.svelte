<script>
	import { onMount } from 'svelte';
	import { start } from './main';

	onMount(() => {
		start();
	});
</script>

<canvas id="three-canvas" />

<style>
	canvas {
		position: fixed;
		top: 0;
		left: 0;
	}
</style>
