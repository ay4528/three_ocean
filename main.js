import './style.css';
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

import bg from "./textures/waternormals.jpg";

//canvas
const canvas = document.querySelector("#canvas");

//サイズ
const sizes = {
	width: innerWidth,
	height: innerHeight,
};

//シーン
const scene = new THREE.Scene();

//カメラ
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	1000
);
camera.position.set(30, 30, 100);

//レンダラー
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	// alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

//水の作成
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(
	waterGeometry,
	{
		textureWidth: 512,
		textureHeight: 512,
		waterNormals: new THREE.TextureLoader().load(bg, function (texture) {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		}),
		sunDirection: new THREE.Vector3(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 3.7,
		fog: scene.fog !== undefined
	}
);
water.rotation.x = - Math.PI / 2;
scene.add(water);


//空の作成
const sun = new THREE.Vector3();

const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
	elevation: 13,
	azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);
let renderTarget;

function updateSun() {

	const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
	const theta = THREE.MathUtils.degToRad(parameters.azimuth);

	sun.setFromSphericalCoords(1, phi, theta);

	sky.material.uniforms['sunPosition'].value.copy(sun);
	water.material.uniforms['sunDirection'].value.copy(sun).normalize();

	if (renderTarget !== undefined) renderTarget.dispose();

	renderTarget = pmremGenerator.fromScene(sky);

	scene.environment = renderTarget.texture;

}

updateSun();

//GUI
const gui = new GUI();

const folderSky = gui.addFolder('Sky');
folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
folderSky.add(parameters, 'azimuth', - 180, 180, 0.1).onChange(updateSun);
folderSky.open();

const waterUniforms = water.material.uniforms;

const folderWater = gui.addFolder('Water');
folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
folderWater.open();

//マウス制御
const controls = new OrbitControls(camera, renderer.domElement);

//ジオメトリ・マテリアル・メッシュ
const geometry = new THREE.BoxGeometry(30, 30, 30);
const material = new THREE.MeshStandardMaterial({ roughness: 0 });

const box = new THREE.Mesh(geometry, material);
scene.add(box);

//アニメーション
const tick = () => {
	window.requestAnimationFrame(tick);

	const time = performance.now() * 0.001;

	water.material.uniforms['time'].value += 1.0 / 60.0;

	box.position.y = Math.sin(time) * 20 + 5;
	box.rotation.x = time * 0.5;
	box.rotation.z = time * 0.51;

	renderer.render(scene, camera);
};

tick();

//ブラウザのリサイズ操作
window.addEventListener("resize", () => {
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(window.devicePixelRatio);
});