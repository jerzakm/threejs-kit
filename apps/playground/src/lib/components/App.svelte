<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Renderer from './Renderer.svelte';
</script>

<Canvas>
	<Renderer />
	<slot />
</Canvas>
