﻿// Define the standard global variables
var container,
	scene, 
	camera,
	renderer,
	mouseMesh,
	projector,
	planet;
	
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

init();
animate();



function init() {

	// Scene
	scene = new THREE.Scene();

	// Camera
	var nearDistance = 1,
		farDistance = 2000;
		
	camera = new THREE.PerspectiveCamera( 45, WIDTH / HEIGHT, nearDistance, farDistance );
	camera.position.z = 2000;
	camera.position.x = 0;
	scene.add( camera );
	//camera.position.set(0, 0, 5);
	//camera.lookAt(scene.position);

	// Renderer engine together with the background
	renderer = new THREE.WebGLRenderer({
			antialias: true,
    	alpha: true
	});
	
	renderer.setSize(WIDTH, HEIGHT);
	container = document.getElementById('container');
	container.appendChild(renderer.domElement); 

	// Define the lights for the scene
	var lightAmb = new THREE.AmbientLight(0x404040,5);
	scene.add(lightAmb);


	// Create a circle around the mouse and move it
	// The sphere has opacity 0
	var mouseGeometry = new THREE.SphereGeometry(1, 0, 0);
	var mouseMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	mouseMesh = new THREE.Mesh(mouseGeometry, mouseMaterial);
	mouseMesh.position.z = -5;
	scene.add(mouseMesh);

	// When the mouse moves, call the given function
	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('click', onMouseClick, false);
	//document.addEventListener("touchstart", onMouseClick, false); 

	adicionarObjeto();
	
	container.addEventListener('resize', function(){
		
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;
		
		renderer.setViewport(0, 0, WIDTH, HEIGHT);
		
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
		
		renderer.setSize( WIDTH, HEIGHT );	
	
	}, true);
	
	projector = new THREE.Projector();

}

function adicionarObjeto(){


	var objLoader = new THREE.OBJLoader();
	var mtlLoader = new THREE.MTLLoader();

	var path = "model/";

	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};

	var onError = function(xhr){
		console.log( 'An error happened' );
		console.log( xhr );
	}

	mtlLoader.setTexturePath( path );
	mtlLoader.setPath( path );
	mtlLoader.load( 'earth.mtl', function( materials ) {

		materials.preload();
		objLoader.setMaterials( materials );
		objLoader.setPath( path );
		objLoader.load( 'earth.obj', function ( object ) {
						planet = object;
						scene.add( planet );

					}, onProgress, onError );
	});

}

function getCoordinates(event){
	
	mouse ={};
	event.preventDefault();
	mouse.x =  event.clientX - WIDTH/2; 
	mouse.y = -(event.clientY - HEIGHT/2);
	//console.log("(",mouse.x.toFixed(2), ",",mouse.y.toFixed(2),")");
	return mouse;
}


function distance(first_point,second_point){
	
	var horizontal_distance_square = first_point.x - second_point.x;
	horizontal_distance_square *= horizontal_distance_square;
	
	var vertical_distance_square = first_point.y - second_point.y;
	vertical_distance_square *= vertical_distance_square;
	
	return Math.sqrt(horizontal_distance_square + vertical_distance_square);
}



function onMouseClick(event){

	var raycaster = new THREE.Raycaster();
	var vector = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, 
		- ( event.clientY / window.innerHeight ) * 2 + 1);
	raycaster.setFromCamera( vector, camera );
	var intersect = raycaster.intersectObject(planet, true);	
	console.log(intersect);

	/*if(intersect.length >0){
		alert("ok");
	}*/
	
}


// Follows the mouse event
function onMouseMove(event) {

  var mouse = getCoordinates(event);

	mouseMesh.position.set(mouse.x, mouse.y, 0);
};

// Animate the elements
function animate() {
    requestAnimationFrame(animate);
		render();	
}
	
// Rendering function
function render() {
	camera.lookAt( scene.position );
	renderer.autoClear = false;
	renderer.clear();
	renderer.render(scene, camera);
};
