"use strict";
import * as distributions from 'https://luiscastro193.github.io/PRNG/distributions.js';

const PI2 = Math.PI * 2;
const randomNormal = distributions.toNormal(Math.random);
const N = 15;
const lifeExpectancy = 60 * 1000;
const lifeDeviation = 10 * 1000;
const randomLife = distributions.toGamma(lifeExpectancy, lifeDeviation, Math.random);
const randomSpawn = distributions.toGamma(lifeExpectancy / N, lifeDeviation / N, Math.random);
const randomSize = distributions.toLogNormal(.03, .005, Math.random);
const randomAlpha = distributions.toBeta(.85, .1, Math.random);
const randomPosition = distributions.toBeta(.5, .25, Math.random);
const steerDeviation = 5e-4 * PI2;
const randomSteer = () => steerDeviation * randomNormal();
const randomSpeed = distributions.toLogNormal(.01 / 1000, .005 / 1000, Math.random);
const randomAcceleration = distributions.toGamma(1, 1e-4, Math.random);

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
		else this.remainingLife *= Math.random();
		
		if (this.remainingLife > 0) {
			this.size = randomSize();
			this.color = `rgba(255, 255, 255, ${randomAlpha()})`;
			this.x = randomPosition();
			this.y = randomPosition();
			this.theta = PI2 * Math.random();
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

function resizeCanvas() {
	({width, height} = canvas.getBoundingClientRect());
	referenceLength = Math.min(width, height);
	canvas.width = Math.ceil(width * devicePixelRatio);
	canvas.height = Math.ceil(height * devicePixelRatio);
	ctx.scale(canvas.width / width, canvas.height / height);
}

addEventListener("resize", resizeCanvas);
requestAnimationFrame(() => requestAnimationFrame(resizeCanvas));

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
