<script lang="ts">
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { BufferAttribute, Vector3 } from 'three';

	interactivity();
</script>

<T.Mesh
	{...$$restProps}
	on:create={({ ref }) => {
		// ref.geometry.computeVertexNormals();
		// ref.geometry.computeTangents();
		const normalAttribute = ref.geometry.getAttribute('normal');
		const n = normalAttribute.count;
		const tangentArray = new Float32Array(n * 3);
		const tangentAttribute = new BufferAttribute(tangentArray, 3);

		const v = new Vector3();
		for (let i = 0; i < n; i++) {
			v.fromBufferAttribute(normalAttribute, i);
			v.set(v.z, 0, -v.x).normalize();
			tangentAttribute.setXYZ(i, v.x, v.y, v.z);
		}
		ref.geometry.setAttribute('tangent', tangentAttribute);
		ref.geometry.getAttribute('tangent').needsUpdate = true;
	}}
	on:click={(e) => {
		console.log(e);
	}}
>
	<slot />
</T.Mesh>
