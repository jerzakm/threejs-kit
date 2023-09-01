import "./style.css";
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const light = new THREE.AmbientLight(0x404040); // soft white light
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.9);
directionalLight.position.set(-3, 3, 3);
scene.add(light, directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.SphereGeometry(3);
const material = new THREE.MeshStandardMaterial({ color: 0xee7722 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.set(5, 5, 5);
controls.update();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  renderer.render(scene, camera);
}
animate();
