// Define the standard global variables
var container,
	scene, 
	camera,
	renderer,
	plane,
	mouseMesh;
	
var points = [];
var lines  = [];
var polygons = [];
var projector;
var dragControls;
	
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

init();
animate();



function init() {

	// Scene
	scene = new THREE.Scene();

	// Camera
	var nearDistance = 0.1,
		farDistance = 1000;
		
	camera = new THREE.OrthographicCamera( WIDTH / - 2, WIDTH / 2, HEIGHT / 2, HEIGHT / - 2, nearDistance, farDistance );
	scene.add( camera );
	camera.position.set(0, 0, 5);
	camera.lookAt(scene.position);

	// Renderer engine together with the background
	renderer = new THREE.WebGLRenderer({
			antialias: true,
    	alpha: true
	});
	
	renderer.setSize(WIDTH, HEIGHT);
	container = document.getElementById('container');
	container.appendChild(renderer.domElement); 

	// Define the lights for the scene
	var light = new THREE.PointLight(0xffffff);
	light.position.set(20, 0, 20);
	scene.add(light);
	var lightAmb = new THREE.AmbientLight(0x777777);
	scene.add(lightAmb);


	// Create a circle around the mouse and move it
	// The sphere has opacity 0
	var mouseGeometry = new THREE.SphereGeometry(10, 0, 0);
	var mouseMaterial = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	mouseMesh = new THREE.Mesh(mouseGeometry, mouseMaterial);
	mouseMesh.position.z = -5;
	scene.add(mouseMesh);

	// When the mouse moves, call the given function
	document.addEventListener('mousemove', onMouseMove, false);
	document.addEventListener('click', onMouseClick, false);
	document.addEventListener("touchstart", onMouseClick, false); 
	
	container.addEventListener('resize', function(){
		
		WIDTH = window.innerWidth;
		HEIGHT = window.innerHeight;
		
		renderer.setViewport(0, 0, WIDTH, HEIGHT);
		
		camera.aspect = WIDTH / HEIGHT;
		camera.updateProjectionMatrix();
		

		renderer.setSize( WIDTH, HEIGHT );	
	
	}, true);
	
	projector = new THREE.Projector();
	dragControls = new THREE.DragControls( polygons, camera, renderer.domElement );
	dragControls.addEventListener( 'dragstart', onMouseDragStart);

  dragControls.addEventListener( 'dragend',onMouseDragEnd);
}

function onMouseDragStart(){
	//console.log("start");
}

function onMouseDragEnd(){
	//console.log("dragend");
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

function intercepta_segmentos_anteriores(){
	
		var point1 = {x : points[points.length - 2].x, y : points[points.length - 2].y},
			point2 = {x : points[points.length - 1].x, y : points[points.length - 1].y},
			point3 = {x:undefined, y:undefined}, 
			point4 = {x:undefined, y:undefined},
			pointI = {x:undefined, y:undefined};
		
		var xi, yi;
		var a1, a2, b1, b2;
		
	for(var i =0; i< lines.length; i++) {

		point3.x = lines[i].geometry.vertices[0].x;
		point4.x = lines[i].geometry.vertices[1].x;
		point3.y = lines[i].geometry.vertices[0].y;
		point4.y = lines[i].geometry.vertices[1].y;
	
		if (point2.x == point1.x || point4.x == point3.x) {
			return false;
		}
		
		if(point1.x == point4.x && point1.y == point4.y){
			return false; 
		}
		
		a1 = ((point2.y-point1.y)/(point2.x - point1.x));
		a2 = ((point4.y-point3.y)/(point4.x-point3.x));
		b1 = point1.y -(a1*point1.x);
		b2 = point3.y -(a2*point3.x);
		
		if (a1%a2==0 || a2%a1==0) {
			return false;
		}
		
		pointI.x = (b2-b1)/(a1-a2);
		pointI.y = (a1*pointI.x) +b1;
		
		if(distance(point1, pointI) + distance(pointI, point2) <= distance(point1, point2)*1.1 &&
		distance(point3, pointI) + distance(pointI, point4) <= distance(point3, point4)*1.1){
			 return true;
		}
				
	}
	
	return false;
}

function onMouseClick(event){

	
	var raycaster = new THREE.Raycaster();
	var vector = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1, 
		- ( event.clientY / window.innerHeight ) * 2 + 1);
	raycaster.setFromCamera( vector, camera );
	var intersects = raycaster.intersectObjects( polygons );

	if(intersects.length == 1){

		pregarUnicoPoligono(intersects[0].object, intersects[0].point);
	}

	if(intersects.length >= 2){
		pregarDoisPoligonos(intersects[intersects.length - 1].object,intersects[intersects.length - 2].object,intersects[0].point);
	}

	else if(intersects.length === 0){
		var point = getCoordinates(event);
		var pontoJaMapeado = false;
		for(var i =0; i<points.length; i++){
			if(points[i].x === point.x && points[i].y === point.y){
				pontoJaMapeado = true;
			}
		}

		if(!pontoJaMapeado){
			points.push(point);
			if(points.length >1){
				
				if(points.length >3 && (distance(points[0],points[points.length - 1])<15 || intercepta_segmentos_anteriores())){
					
					lines.forEach(function(line) {
						scene.remove(line);
					});
					
					draw_polygon();
					points.length = 0;	

				} else{
					
					draw_line();
					
				}

			}
		}
	}	
	
}

function draw_line(){
	
	var material = new THREE.LineBasicMaterial({ color: 0x0000ff });
	var geometry = new THREE.Geometry();
	geometry.vertices.push(new THREE.Vector3(points[points.length - 2].x, points[points.length - 2].y, 0));
	geometry.vertices.push(new THREE.Vector3(points[points.length - 1].x , points[points.length - 1].y, 0));
	var line = new THREE.Line(geometry, material);
	lines.push(line);
	scene.add(line);
		
}

function draw_polygon(){
	
	var geometry = new THREE.Geometry();
			
			points.forEach(function(point) {
				geometry.vertices.push(new THREE.Vector3(point.x,point.y,0));
			});
			
			var holes = [];
			var triangles = THREE.ShapeUtils.triangulateShape ( geometry.vertices, holes );
			
			triangles.forEach(function(triangle) {
				geometry.faces.push(new THREE.Face3(triangle[0], triangle[1], triangle[2]));
			});
			
			var color = Math.random() * 0xffffff ;
			
			var redMat = new THREE.MeshBasicMaterial({color: color});
			var polygon = new THREE.Mesh(geometry, redMat);

			polygon.pregosNaTela = [];

			polygon.pregosEmOutroPoligonos = [];

			polygons.push(polygon);
			
			scene.add(polygon);
		
}

function pregarDoisPoligonos(poligonoPai, poligonoFilho, ponto){

	var geometry = new THREE.SphereGeometry(10, 0, 0);
	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	prego = new THREE.Mesh(geometry, material);

	prego.position.set(ponto.x, ponto.y, -2);

	poligonoPai.children.push(poligonoFilho);
	poligonoFilho.parent = poligonoPai;

	scene.add(prego);

}

function pregarUnicoPoligono(poligono, ponto){


	var geometry = new THREE.SphereGeometry(10, 0, 0);
	var material = new THREE.MeshBasicMaterial({
		color: 0x0000ff
	});
	prego = new THREE.Mesh(geometry, material);

	prego.position.set(ponto.x, ponto.y, -2);

	//console.log(poligono);

	poligono.pregosNaTela.push(prego);



	scene.add(prego);

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

	// For rendering
	renderer.autoClear = false;
	renderer.clear();
	renderer.render(scene, camera);
};
