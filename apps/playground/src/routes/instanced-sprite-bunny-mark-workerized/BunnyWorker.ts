let lastTime = performance.now();

let positions: Float32Array;
let velocity: Float32Array;

onmessage = function (e) {
	const { positionsBuffer, velocityBuffer, gravity, count, bounds, type, from, to } = e.data;

	if (type == 'setup') {
		// x,y
		positions = new Float32Array(positionsBuffer);

		// vX, vY
		velocity = new Float32Array(velocityBuffer);
	}

	function update() {
		// Example update: move instances along their velocity vector
		const currentTime = performance.now();
		const delta = ((currentTime - lastTime) / 1000) * 200; // Convert to seconds
		for (let i = from; i < to; i++) {
			positions[i * 2] += velocity[i * 2]; // x += vx
			positions[i * 2 + 1] += velocity[i * 2 + 1]; // y += vy

			velocity[i * 2 + 1] += gravity * delta;

			// roll new behaviour if bunny gets out of bounds

			if (positions[i * 2] > bounds.right) {
				velocity[i * 2] *= -1;
				positions[i * 2] = bounds.right;
			} else if (positions[i * 2] < bounds.left) {
				velocity[i * 2] *= -1;
				positions[i * 2] = bounds.left;
			}

			if (positions[i * 2 + 1] > bounds.top) {
				velocity[i * 2 + 1] *= -0.85;
				positions[i * 2 + 1] = bounds.top;
				if (Math.random() > 0.5) {
					velocity[i * 2 + 1] -= Math.random() * 6;
				}
			} else if (positions[i * 2 + 1] < bounds.bottom) {
				velocity[i * 2 + 1] *= -1;
				positions[i * 2 + 1] = bounds.top;
			}
		}
		lastTime = currentTime * 1;

		// Schedule the next update
		setTimeout(update, 0); // roughly 60fps
	}
	update();
};
