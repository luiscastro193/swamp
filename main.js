"use strict";
import * as distributions from 'https://luiscastro193.github.io/PRNG/PRNG.js';

const PI2 = Math.PI * 2;
const rng = await distributions.generator();
const random = await distributions.next(rng);
const N = 15;
const lifeExpectancy = 60 * 1000;
const lifeDeviation = 10 * 1000;
const randomLife = await distributions.distribution('gamma', lifeExpectancy, lifeDeviation, rng);
const randomSpawn = await distributions.distribution('gamma', lifeExpectancy / N, lifeDeviation / N, rng);
const randomSize = await distributions.distribution('lognormal', .03, .005, rng);
const randomAlpha = await distributions.distribution('beta', .85, .1, rng);
const randomPosition = await distributions.distribution('beta', .5, .25, rng);
const randomSteer = await distributions.distribution('normal', 0, 5e-4 * PI2, rng);
const randomSpeed = await distributions.distribution('lognormal', .01 / 1000, .005 / 1000, rng);
const randomAcceleration = await distributions.distribution('gamma', 1, 1e-4, rng);

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let width, height, referenceLength;

function module(n, m) {
	return ((n % m) + m) % m;
}

class Firefly {
	constructor(lifeDelta) {
		this.remainingLife = randomLife();
		if (lifeDelta) this.remainingLife += lifeDelta;
		else this.remainingLife *= random();
		
		if (this.remainingLife > 0) {
			this.size = randomSize();
			this.color = `rgba(255, 255, 255, ${randomAlpha()})`;
			this.x = randomPosition();
			this.y = randomPosition();
			this.theta = PI2 * random();
			this.speed = randomSpeed();
		}
	}
	
	draw(time) {
		this.remainingLife -= time;
		
		if (this.remainingLife > 0) {
			this.theta += randomSteer();
			this.speed *= randomAcceleration();
			this.x = module(this.x + this.speed * time * Math.cos(this.theta), 1);
			this.y = module(this.y + this.speed * time * Math.sin(this.theta), 1);
			
			ctx.beginPath();
			ctx.arc(this.x * width, this.y * height, this.size * referenceLength, 0, PI2);
			ctx.fillStyle = this.color;
			ctx.fill();
			
			return true;
		}
	}
}

function resizeCanvas([resizeEntry]) {
	canvas.width = width = resizeEntry.devicePixelContentBoxSize?.[0].inlineSize || Math.ceil(resizeEntry.contentBoxSize[0].inlineSize * devicePixelRatio);
	canvas.height = height = resizeEntry.devicePixelContentBoxSize?.[0].blockSize || Math.ceil(resizeEntry.contentBoxSize[0].blockSize * devicePixelRatio);
	referenceLength = Math.min(width, height);
}

new ResizeObserver(resizeCanvas).observe(canvas);

let drawObjects = Array.from({length: N}, () => new Firefly());
let spawnTime = randomSpawn();
let lastTime = performance.now();

function draw(time) {
	const elapsedTime = time - lastTime;
	lastTime = time;
	spawnTime -= elapsedTime;
	
	while (spawnTime <= 0) {
		drawObjects.push(new Firefly(spawnTime + elapsedTime));
		spawnTime += randomSpawn();
	}
	
	ctx.clearRect(0, 0, width, height);
	drawObjects = drawObjects.filter(object => object.draw(elapsedTime));
	requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

function autoHideCursor(element, timeout = 1000) {
	let timer;
	
	function setTimer() {
		element.style.cursor = '';
		clearTimeout(timer);
		timer = setTimeout(() => {element.style.cursor = 'none'}, timeout);
	}
	
	element.addEventListener('mousemove', setTimer, {passive: true});
	setTimer();
}

autoHideCursor(canvas);
