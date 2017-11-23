// Define the standard global variables
var container,
	scene, 
	camera,
	renderer,
	mouseMesh,
	projector,
	planet,
	centro,
	raio;

	
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

						centro = {"x":0 , "y":0, "z":0};
						raio = 330,

						scene.add( planet );

					}, onProgress, onError );
	});

}

function transformarParaCoordenadasMundo(coordX, coordY){
	
	point ={};
	point.x = ( coordX/ WIDTH ) * 2 - 1;
	point.y = - ( coordY / HEIGHT ) * 2 + 1;
	
	return point;
}


function distance(first_point,second_point){
	
	var horizontal_distance_square = first_point.x - second_point.x;
	horizontal_distance_square *= horizontal_distance_square;
	
	var vertical_distance_square = first_point.y - second_point.y;
	vertical_distance_square *= vertical_distance_square;
	
	return Math.sqrt(horizontal_distance_square + vertical_distance_square);
}

var ultimoPontoClicado = {"x":null, "y":null};

function onMouseClick(event){

	ultimoPontoClicado.x = event.clientX;
	ultimoPontoClicado.y = event.clientY;
	
}

function obterPontoObj(coordX, coordY){

	var raycaster = new THREE.Raycaster();
	var vector = new THREE.Vector2(( coordX / WIDTH ) * 2 - 1, 
		- ( coordY / HEIGHT ) * 2 + 1);
	raycaster.setFromCamera( vector, camera );
	var intersect = raycaster.intersectObject(planet, true);

	if(intersect.length ==0){
		
		var point = transformarParaCoordenadasMundo(coordX, coordY);
		r = (point.x-centro.x)*(point.x-centro.x) + (point.y-centro.y)*(point.y-centro.y);
		r = Math.sqrt(r);

		point.x = (point.x -centro.x)/r;
		point.y = (point.y -centro.y)/r;
		point.z = centro.z;

		return point;
	}

	else{
		return intersect[0].point;

	}

}


// Follows the mouse event
function onMouseMove(event) {

	if(event.buttons == 1){
		//mouse esquerdo pressionado
		var pontoInicial = Object.assign({}, ultimoPontoClicado); 
		var pontoFinal = {"x": event.clientX, "y":event.clientY};

		rotacionarObjetoPressionado(pontoInicial,pontoFinal);

		ultimoPontoClicado.x = event.clientX;
		ultimoPontoClicado.y = event.clientY;
	}
};

function rotacionarObjetoPressionado(pontoInicial,pontoFinal){

	if(pontoInicial.x!== null){

	var pontoInicial = obterPontoObj(pontoInicial.x, pontoInicial.y);
	var pontoFinal   = obterPontoObj(pontoFinal.x, pontoFinal.y);

	console.log("inicial",pontoInicial);
	console.log("final",pontoFinal);

	//falta abater do centro da esfera

	var quaternionInicial = new THREE.Quaternion(pontoInicial.x -centro.x,pontoInicial.y -centro.y,pontoInicial.z-centro.z,0);
	var quaternionFinal   = new THREE.Quaternion(pontoFinal.x -centro.x,pontoFinal.y -centro.y,pontoFinal.z -centro.z,0);
	var quaternionRotacao = new THREE.Quaternion();

	quaternionInicial.normalize();
	quaternionFinal.normalize();

	quaternionRotacao.multiplyQuaternions(quaternionFinal,quaternionInicial.conjugate());

	planet.applyQuaternion( quaternionRotacao );

	}
}

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
