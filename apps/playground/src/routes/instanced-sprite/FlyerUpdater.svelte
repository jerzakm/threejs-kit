<script lang="ts">
	import { useFrame, watch } from '@threlte/core';
	import { getContext } from 'svelte';
	import { Vector2 } from 'three';

	const spriteCtx: any = getContext('instanced-sprite-ctx');
	const { updatePosition, count, animationMap, setAnimation, mesh } = spriteCtx;

	//@ts-ignore
	watch(animationMap, (anims: Map<string, number>) => {
		// console.log(anims.keys());
	});

	// mesh.material.uniforms.animationId.value = 0;

	// mesh.animation.setGlobal('fly');

	mesh.offset.randomizeAll();

	console.log(mesh);

	const posX: number[] = new Array(count).fill(0);
	const posY: number[] = new Array(count).fill(0);
	const posZ: number[] = new Array(count).fill(0);

	const spread = 80;
	const minCenterDistance = 0.5;
	const maxCenterDistance = spread;
	const rndPosition: any = () => {
		const x = Math.random() * spread - spread / 2;
		const y = Math.random() * spread - spread / 2;

		/** min distance from 0,0. Recursive reroll if too close */

		if (Math.sqrt(x ** 2 + y ** 2) < minCenterDistance) {
			return rndPosition();
		}

		return { x, y };
	};

	/** update from 1 because 0 is user controlled and set at 0,0 */
	for (let i = 1; i < count; i++) {
		const pos = rndPosition();
		posX[i] = pos.x;
		posY[i] = 2 + Math.random() * 10;
		posZ[i] = pos.y;
	}

	type Agent = {
		action: 'Idle' | 'Run';
		velocity: [number, number];
		timer: number;
	};

	const agents: Agent[] = [];
	for (let i = 0; i < count; i++) {
		agents.push({
			action: 'Run',
			timer: 0.1,
			velocity: [0, 1]
		});
	}

	const velocityHelper = new Vector2(0, 0);

	const updateAgents = (delta: number) => {
		for (let i = 0; i < agents.length; i++) {
			// timer
			agents[i].timer -= delta;

			// apply velocity
			posX[i] += agents[i].velocity[0] * delta;
			posZ[i] += agents[i].velocity[1] * delta;

			// roll new behaviour when time runs out or agent gets out of bounds
			if (i > 0) {
				const dist = Math.sqrt((posX[i] || 0) ** 2 + (posZ[i] || 0) ** 2);
				if (agents[i].timer < 0 || dist < minCenterDistance || dist > maxCenterDistance) {
					const runChance = 0.6 + (agents[i].action === 'Idle' ? 0.3 : 0);
					agents[i].action = Math.random() < runChance ? 'Run' : 'Idle';

					agents[i].timer = 5 + Math.random() * 5;

					if (agents[i].action === 'Run') {
						velocityHelper
							.set(Math.random() - 0.5, Math.random() - 0.5)
							.normalize()
							.multiplyScalar(0.1);
						agents[i].velocity = velocityHelper.toArray();
					}
				}
			}
		}
	};

	useFrame((_, _delta) => {
		if ($animationMap.size > 0) {
			updateAgents(_delta);
		}

		for (let i = 0; i < count; i++) {
			// $camera.position.set(0 + (posX[0] || 0), 7, 15 + (posZ[0] || 0))

			updatePosition(i, [posX[i] || 0, posY[i] || 0, posZ[i] || 0]);
			setAnimation(i, 0);
		}
	});
</script>
