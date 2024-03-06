<script>
	import { onMount } from 'svelte';
	import { start } from './main';

	import { page } from '$app/stores';

	const url = $page.url;

	const param = url.searchParams.get('count');

	const count = parseInt(param);

	onMount(() => {
		start(count);
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
		Displaying <b>{count}</b> bunnies.
	</span>
	<ul>
		<span>Go to:</span>
		{#each countOptions as c}
			<li>
				<a data-sveltekit-reload href={`/instanced-sprite-bunny-mark?count=${c}`}>{c}</a>
			</li>
		{/each}
	</ul>
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
		margin: 0;
		padding: 0;
		gap: 1rem;
		list-style: none;
	}
	.menu {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background-color: black;
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
