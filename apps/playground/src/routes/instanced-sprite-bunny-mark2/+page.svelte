<script lang="ts">
	import { onMount } from 'svelte';
	import { initDemonBench } from './mainDemons';

	import { page } from '$app/stores';
	import { initBunBench } from './mainBunnies';

	const url = $page.url;

	const param = url.searchParams.get('count');

	const count = parseInt(param) || 1000;
	const mode = url.searchParams.get('mode') || 'bunnies';

	onMount(() => {
		if (mode === 'bunnies') {
			initBunBench(count);
		} else {
			initDemonBench(count);
		}
	});

	const countOptions = [500, 2000, 10000, 50000, 100000, 200000, 400000, 600000, 800000, 1000000];
</script>

<div class="menu">
	<div>
		Bunmark for <a href="https://github.com/jerzakm/threejs-kit"
			>@threejs-kit/instanced-sprite-mesh.</a
		>
	</div>
	<span>
		Displaying <b>{count}</b>
		{mode}.
	</span>
	<ul>
		<span style="width: 140px;">Bunnies (static):</span>
		{#each countOptions as c}
			<li>
				<a data-sveltekit-reload href={`/instanced-sprite-bunny-mark2?count=${c}&mode=bunnies`}
					>{c}</a
				>
			</li>
		{/each}
	</ul>
	<ul>
		<span style="width: 140px;">Demons (animated):</span>
		{#each countOptions as c}
			<li>
				<a data-sveltekit-reload href={`/instanced-sprite-bunny-mark2?count=${c}&mode=demons`}
					>{c}</a
				>
			</li>
		{/each}
	</ul>
	{#if mode === 'demons'}
		Each demon has a random animation (idle, death, fly, attack) that changes each time it hits the
		screen boundary, a separate animation progression and changes flipX based on the direction.
	{/if}
</div>

<canvas id="three-canvas" />

<style>
	a {
		color: white;
	}
	b {
		color: orange;
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		padding: 0;
		gap: 1rem;
		list-style: none;
	}
	.menu {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background-color: rgba(0, 0, 0, 0.35);
		color: #cccccc;
		padding: 0.15rem 0.2rem;
		position: fixed;
		top: 0;
		left: 100px;
		z-index: 9999;
	}
	canvas {
		position: fixed;
		top: 0;
		left: 0;
	}
</style>
