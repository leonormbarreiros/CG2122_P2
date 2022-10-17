/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * Variables refering to the clock, renderer, cameras and scene  * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var clock = new THREE.Clock(true);
var dt = clock.getDelta();
var speed = 50;
var timeTarget = 0;

var camera1, camera2, camera3;
var camera, scene, renderer;
var geometry, material, mesh;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * Variables refering to the objects * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
 * Planet object
 */
var planet;

/*
 * Rocket object
 */
var rocket;
var rocket_b_sphere;
var capsules, capsule1, capsule2, capsule3, capsule4;
var body, nose;

/* 
 * Trash objects: octahedrons ("poliedro regular")
 */
var octahedrons = [];

/* 
 * Trash objects: cubes ("cubos")
 */
var cubes = [];

/* 
 * Trash objects: cones ("cones")
 */
var cones = [];

/* Trash objects: one vector per semi-hemisphere */
var t1 = [];
var t2 = [];
var t3 = [];
var t4 = [];
var t5 = [];
var t6 = [];
var t7 = [];
var t8 = [];      

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * Variables refering to measurement * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var R = 200; // The radius of the planet: R

var Rc = 5; // The radius of the rocket

/* The maximum wingspan of the trash: C
 * R / 24 < C < R / 20
 */
var C = R / 20 - 0.001;

/* The maximum height of the ship: H
 * R / 12 < H < R / 10
 */
var H = R / 10 - 0.001;

var theta, phi; // Variables referring to the spheric coordinates

/* The radius of the bounding volumes of the rocket and the space trash */
var radius_rocket = H / 2, radius_trash = C / 2;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * Generic support variables * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var is_camera1 = true, is_camera2 = false, is_camera3 = false;
var translate_up = false, translate_down = false;
var translate_left = false, translate_right = false;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Init fucntion that defines the renderer and calls the auxiliary functions 
 * to create the scene and the cameras.
 * 
 */
function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
   
    createScene();
    createCamera();
    camera = camera1;
    
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

}

/**
 * Implements the update/display cycle.
 */
function animate() {
    'use strict';

    update(); // update the scene
    render(); // display the new scene
    requestAnimationFrame(animate);
}

/**
 * Updates every object according to the inherent physics.
 * For example, processes colision detection and implements the 
 * according behaviors. Also allows to switch between cameras and
 * translate the rocket.
 */
function update() {
    // 1. set appropriate camera
    if (is_camera1) {
        camera = camera1;
    }
    if (is_camera2) {
        camera = camera2;
    }
    if (is_camera3) {
        camera = camera3;
    }
    
    // 2. move the rocket
    var new_longitude = 0, new_latitude = 0;
    var old_longitude = theta, old_latitude = phi;

    var pos_x = rocket.position.getComponent(0);
    var pos_y = rocket.position.getComponent(1);

    dt = clock.getDelta();
    
    if (translate_up) {
        new_latitude  += 0.05 * speed * dt;
    }
    if (translate_down) {
        new_latitude  -= 0.05 * speed * dt;
    }
    if (translate_left) {
        new_longitude += 0.05 * speed * dt; 
    }
    if (translate_right) {
        new_longitude -= 0.05 * speed * dt;
    }
    if (pos_x == 0 || pos_y == 0) {
        new_latitude = 0;
        new_longitude = 0;
    }

    if (translate_up || translate_down || translate_left || translate_right) {
        theta = (old_longitude + new_longitude);
        phi   = (old_latitude  + new_latitude );

        var x = Math.cos(theta) * Math.sin(phi);
        var y =                   Math.cos(phi);
        var z = Math.sin(theta) * Math.sin(phi);

        var vec = new THREE.Vector3(x, y, z);
        vec.normalize();
        vec.multiplyScalar(R * 1.2);

        rocket.position.set(vec.getComponent(0), vec.getComponent(1), vec.getComponent(2));
        
        var q1 = rocket.quartile();
        var trash;
        if (q1 == 0) {
            trash = [...t1];
        }
        if (q1 == 1) {
            trash = [...t2];
        }
        if (q1 == 2) {
            trash = [...t3];
        }
        if (q1 == 3) {
            trash = [...t4];
        }
        if (q1 == 4) {
            trash = [...t5];
        }
        if (q1 == 5) {
            trash = [...t6];
        }
        if (q1 == 6) {
            trash = [...t7];
        }
        if (q1 == 7) {
            trash = [...t8];
        }
        for (let i = 0; i < trash.length; i++) {
            if (rocket.hasCollision(trash[i])) {
                /* If the objects collide in a single point, delete the trash */
                if (rocket.findIntersection(trash[i]) == 0) {
                    trash[i].processCollision(i, q1);
                }
                /* If the rocket is going through the trash, reset its position */
                else {
                    rocket.set_position(old_longitude, old_latitude);
                }
            }
        }

        rocket.lookAt(scene.position);
        camera3.lookAt(rocket.position);

        rotateRocket();
    }

}

/**
 * Generates the image displayed on the screen
 */
function render() {
    'use strict';

    renderer.render(scene, camera);
} 

/**
  * Resize the camera when the window is resized
  */ 
function onResize() {
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);
    var aspect = window.innerWidth / window.innerHeight;

    //update Perspective cameras (cameras 2 and 3)
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        camera2.aspect = aspect;
        camera2.updateProjectionMatrix();
        camera3.aspect = aspect;
        camera3.updateProjectionMatrix();
    }

    // update Orthographic camera (camera 1)
    camera1.left = window.innerWidth / - 2;
    camera1.right = window.innerWidth / 2;
    camera1.top = window.innerHeight / 2;
    camera1.bottom = window.innerHeight / - 2;
    camera1.updateProjectionMatrix();
}

/**
 * Handle onKeyDown events
 * 
 * @param {*} e - event that activate this function
 */
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
    case 49: //1
        is_camera1 = true;
        is_camera2 = false;
        is_camera3 = false;
        break;
    case 50:  //2
        is_camera1 = false;
        is_camera2 = true;
        is_camera3 = false;
        break;
    case 51: //3
        is_camera1 = false;
        is_camera2 = false;
        is_camera3 = true;
        break;
    case 38: //up
        translate_up = true;
        break;
    case 40: //down
        translate_down = true;
        break;
    case 39: //right
        translate_right = true;
        break;
    case 37: //left
        translate_left = true;
        break;
    }
}

/**
 * Handle onKeyUp events
 * 
 * @param {*} e - event that activate this function
 */
function onKeyUp(e) {
    'use strict';
    switch (e.keyCode) {
    case 38: //up
        translate_up = false;
        break;
    case 40: //down
        translate_down = false;
        break;
    case 39: //right
        translate_right = false;
        break;
    case 37: //left
        translate_left = false;
        break;
    }
}

/**
 * Set up the Scene 
 */
function createScene() {
    'use strict';
    
    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    createPlanet(0, 0, 0);

    theta = getRandomInt(0, 360);
    phi   = getRandomInt(0, 180);
    createRocket(R * 1.2, theta, phi);

    /* create 7 octahedrons -> space trash */
    for (let i = 0; i < 7; i++) {
        createOctahedron(R * 1.2, getRandomInt(0, 360), getRandomInt(0, 180));
    }
    
    /* create 6 cubes -> space trash */
    for (let i = 0; i < 6; i++) {
        createCube(R * 1.2, getRandomInt(0, 360), getRandomInt(0, 180));
    }

    /* create 7 cones -> space trash */
    for (let i = 0; i < 7; i++) {
        createCone(R * 1.2, getRandomInt(0, 360), getRandomInt(0, 180));
    }
}

/**
 * Creates three cameras in three different positions
 */
function createCamera() {
    'use strict';
    camera1 = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000 );

    camera1.position.x = 0;
    camera1.position.y = 0;
    camera1.position.z = 500;
    camera1.lookAt(scene.position);

    camera2 = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera2.position.set(0, 0, 550);
    camera2.lookAt(scene.position);

    camera3 = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    rocket.add(camera3);
    camera3.position.set(0, -30,-25);
    camera3.lookAt(rocket.position);
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * MAIN FIGS * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function createPlanet(x, y, z) {
    'use strict';
    
    planet = new THREE.Object3D();
    
    material = new THREE.MeshBasicMaterial({ color: 'deepskyblue', wireframe: false });
    geometry = new THREE.SphereGeometry(R, 40, 40);
    mesh = new THREE.Mesh(geometry, material);
    
    planet.add(mesh);
    planet.position.set(x, y, z);
    
    scene.add(planet);
}

function createRocket(r, t, p){
    'use strict';

    let aux = new THREE.Object3D();

    /* Capsules */
    capsules = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0x8D99AE, wireframe: false });

    capsule1 = new THREE.Mesh(new THREE.CapsuleGeometry(Rc/3, 1*H/6-2*Rc/3, 10, 20), material);
    capsule1.position.set(0, 0, -4*Rc/3); 

    capsule2 = new THREE.Mesh(new THREE.CapsuleGeometry(Rc/3, 1*H/6-2*Rc/3, 10, 20), material);
    capsule2.position.set(4*Rc/3, 0, 0); 

    capsule3 = new THREE.Mesh(new THREE.CapsuleGeometry(Rc/3, 1*H/6-2*Rc/3, 10, 20), material);
    capsule3.position.set(0, 0, 4*Rc/3); 

    capsule4 = new THREE.Mesh(new THREE.CapsuleGeometry(Rc/3, 1*H/6-2*Rc/3, 10, 20), material);
    capsule4.position.set(-4*Rc/3, 0, 0); 

    capsules.add(capsule1);
    capsules.add(capsule2);
    capsules.add(capsule3);
    capsules.add(capsule4);
    capsules.position.set(0,-(2*H/6) - (H/2-H/12),0);

    /* Body */
    material = new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false });
    body = new THREE.Mesh(new THREE.CylinderGeometry(Rc, Rc, 3*H/6, 20), material);
    body.position.set(0, -(H/2-H/12), 0);

    /* Nose */
    material = new THREE.MeshBasicMaterial({ color: 0xE9C46A, wireframe: false });
    nose = new THREE.Mesh(new THREE.CylinderGeometry(0, Rc, 2*H/6, 20), material);
    nose.position.set(0, 0, 0);
    
    /* Add components to object */
    aux.add(capsules);
    aux.add(body);
    aux.add(nose);

    /* Position the rocket object in the scene */
    var x = r * Math.cos(t) * Math.sin(p);
    var y = r               * Math.cos(p);
    var z = r * Math.sin(t) * Math.sin(p);

    rocket = new Collider(H / 2, aux);
    rocket.position.set(x, y, z);
    scene.add(rocket);
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * TRASH * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function createOctahedron(r, t, p) {
    'use strict';

    let octahedron = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({ color: 'darkorange', wireframe: false });
    geometry = new THREE.OctahedronGeometry(C / 2, 2);
    mesh     = new THREE.Mesh(geometry, material);

    octahedron.add(mesh);

    var x = r * Math.cos(t) * Math.sin(p);
    var y = r               * Math.cos(p);
    var z = r * Math.sin(t) * Math.sin(p);
    
    var octahedron_collider = new Collider(C / 2, octahedron);
    octahedron_collider.position.set(x, y, z);

    octahedron_collider.add_trash(octahedron_collider.quartile());

    scene.add(octahedron_collider);
}

function createCube(r, t, p) {
    'use strict';

    let cube = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({ color: 'darkseagreen', wireframe: false });
    geometry = new THREE.BoxGeometry(C, C, C);
    mesh     = new THREE.Mesh(geometry, material);

    cube.add(mesh);

    var x = r * Math.cos(t) * Math.sin(p);
    var y = r               * Math.cos(p);
    var z = r * Math.sin(t) * Math.sin(p);
    
    var cube_collider = new Collider(C / 2, cube);
    cube_collider.position.set(x, y, z);

    cube_collider.add_trash(cube_collider.quartile());

    scene.add(cube_collider);
}

function createCone(r, t, p) {
    'use strict';

    let cone = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({ color: 'firebrick', wireframe: false });
    geometry = new THREE.ConeGeometry(C/2, C, 24);
    mesh     = new THREE.Mesh(geometry, material);

    cone.add(mesh);

    var x = r * Math.cos(t) * Math.sin(p);
    var y = r               * Math.cos(p);
    var z = r * Math.sin(t) * Math.sin(p);

    var cone_collider = new Collider(C / 2, cone);
    cone_collider.position.set(x, y, z);

    cone_collider.add_trash(cone_collider.quartile());

    scene.add(cone_collider);
}
    
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * AUXILIARY * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

class Collider extends THREE.Object3D {
    constructor(radius, obj = null) {
        super();
        this.radius = radius;

        if ( obj != null ) {
            this.position.copy(obj.position);
            obj.position.set(0, 0, 0);
            this.add(obj);
        }
        this.obj = obj;
        
        var geo = new THREE.SphereGeometry(radius, radius * 3, radius * 3);
        var mat = new THREE.MeshBasicMaterial({ color: 'black', wireframe: false });
        
        this.bounding_sphere = new THREE.Mesh(geo, mat);
        this.bounding_sphere.visible = false;
        this.add(this.bounding_sphere);
    }

    /**
     * Determines if other, given as argument, is colliding with this
     * @param {*} other the object whose collision we want to detect
     * @returns true if there's a collision, false otherwise
     */
    hasCollision(other) {
        var d_square = (this.position.x - other.position.x) ** 2 
                     + (this.position.y - other.position.y) ** 2
                     + (this.position.z - other.position.z) ** 2
                     ; 
        var r_dif_square = (this.radius + other.radius) ** 2;
        return r_dif_square >= d_square;
    }

    /**
     * Calculates how intersected the objects are, according
     * to the formula: 
     *      d = sqrt( (c_Ax - c_Bx)^2 + (c_Ay - c_By)^2 ) 
     */ 
    findIntersection(other) {
        var d_square = (this.position.x - other.position.x) ** 2 
                     + (this.position.y - other.position.y) ** 2
                     + (this.position.z - other.position.z) ** 2
                     ; 
        var r_dif_square = (this.radius + other.radius) ** 2;
        return Math.round(Math.sqrt(r_dif_square) - Math.sqrt(d_square));
    }

    /**
     * Handles the collision by deleting the at index i of the 
     * trash vector.
     * @param {*} i   the object's index in the trash vector
     * @param {*} q   the object's quatile (semi-hemisphere)
     */
    processCollision(i, q) {
        scene.remove(this);
        this.del_trash(i, q);
    }

    /**
     * Determines the quartile (semi-hemisphere) of the object
     * @returns the number of the quartile
     */
    quartile() {
        var x = this.position.x;
        var y = this.position.y;
        var z = this.position.z;
        if (x >= 0 && y >= 0 && z >= 0) {
            return 0;
        }
        if (x >= 0 && y >= 0 && z <= 0) {
            return 1;
        }
        if (x <= 0 && y >= 0 && z >= 0) {
            return 2;
        }
        if (x <= 0 && y >= 0 && z <= 0) {
            return 3;
        }
        if (x <= 0 && y <= 0 && z >= 0) {
            return 4;
        }
        if (x <= 0 && y <= 0 && z <= 0) {
            return 5;
        }
        if (x >= 0 && y <= 0 && z >= 0) {
            return 6;
        }
        if (x >= 0 && y <= 0 && z <= 0) {
            return 7;
        }
    }

    /**
     * Adds the object to the respective trash vector
     * @param {*} q the object's quartile. Determines the vector 
     * we'll add the object to
     */
    add_trash(q) {
        if (q == 0) {
            t1.push(this);
        }
        if (q == 1) {
            t2.push(this);
        }
        if (q == 2) {
            t3.push(this);
        }
        if (q == 3) {
            t4.push(this);
        }
        if (q == 4) {
            t5.push(this);
        }
        if (q == 5) {
            t6.push(this);
        }
        if (q == 6) {
            t7.push(this);
        }
        if (q == 7) {
            t8.push(this);
        }
    }

    /**
     * Removes the object from the respective trash vector
     * @param {*} i the object's index it its trash vector
     * @param {*} q the object's quartile. Determines the vector we'll 
     * remove the object from
     */
    del_trash(i, q) {
        if (q == 0) {
            t1.splice(i, 1);
        }
        if (q == 1) {
            t2.splice(i, 1);
        }
        if (q == 2) {
            t3.splice(i, 1);
        }
        if (q == 3) {
            t4.splice(i, 1);
        }
        if (q == 4) {
            t5.splice(i, 1);
        }
        if (q == 5) {
            t6.splice(i, 1);
        }
        if (q == 6) {
            t7.splice(i, 1);
        }
        if (q == 7) {
            t8.splice(i, 1);
        }
    }

    /**
     * Places the object in the spherical coordinates defined by t and p
     * @param {*} t longitude
     * @param {*} p latitude
    */
    set_position(t, p) {
        var x = Math.cos(t) * Math.sin(p);
        var y =               Math.cos(p);
        var z = Math.sin(t) * Math.sin(p);

        var vec = new THREE.Vector3(x, y, z);
        vec.normalize();
        vec.multiplyScalar(R * 1.2);

        this.position.set(vec.getComponent(0), vec.getComponent(1), vec.getComponent(2));
    }
}

function rotateRocket(){
    //left
    if(translate_left && !translate_right && !translate_down && !translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(Math.PI/2);
        }
        else{
            rocket.rotateZ(-Math.PI/2);
        }
    }
    //right
    else if(!translate_left && translate_right && !translate_down && !translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(-Math.PI/2);
        }
        else{
            rocket.rotateZ(Math.PI/2);
        }
    }
    //left and down
    else if(translate_left && !translate_right && translate_down && !translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(-(Math.PI + Math.PI/4));
        }
        else{
            rocket.rotateZ(Math.PI + Math.PI/4);
        }
    }
    //right and down
    else if(!translate_left && translate_right && translate_down && !translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(-(Math.PI - Math.PI/4));
        }
        else{
            rocket.rotateZ(Math.PI - Math.PI/4);
        }
    }
    //up
    else if(!translate_left && !translate_right && !translate_down && translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
        }
    }
    //right and up
    else if(!translate_left && translate_right && !translate_down && translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(-Math.PI/4);
        }
        else{
            rocket.rotateZ(Math.PI/4);
        }
    }
    //left and up
    else if(translate_left && !translate_right && !translate_down && translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(-Math.PI/4);
        }
        else{
            rocket.rotateZ(-Math.PI/4);
        }
    }
    //down
    else if(!translate_left && !translate_right && translate_down && !translate_up){
        if(theta > Math.PI/2 && theta<3*Math.PI/2){
            rocket.rotateZ(Math.PI);
            rocket.rotateZ(Math.PI);
        }
        else{
            rocket.rotateZ(Math.PI);
        }
    }
}