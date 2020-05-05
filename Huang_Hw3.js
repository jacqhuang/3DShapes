
/*
 * Jacquelin Huang
 */

var canvas;
var gl;

var program;


var shape = "cylinder";
var interactionFlag = true;

var theta = [0, 0, 0];
var thetaLoc;

var axis = 0;
var autoRotate = false;

var translate = [0, 0, 0];
var translateLoc;
var proj = ortho(-1, 1, -1, 1, -100, 100);

var scale = [0.75, 2.0, 0.75];
var scaleLoc;

var mouse = {
    prevX: 0,
    prevY: 0,

    leftDown: false,
    rightDown: false,
};

var viewer = {
    eye: vec3(0.0, 0.0, 0.0),
    at: vec3(0.0, 0.0, -1.0),
    up: vec3(0.0, 1.0, 0.0),

    radius: null,
    theta: 0,
    phi: 0
};

var perspProj = {
    fov: 60,
    aspect: 1,
    near: 0.1,
    far: 10
}

var vPosition;
var nBuffer;
var vBuffer;
var vNormal;


//first light
var lPosition1 = vec4(1.0, 1.0, 1.0, 0.0);
var lAmbient1 = lPosition1
var lDiffuse1 = lPosition1
var lSpecular1 = lPosition1
var lEnabled1 = true;
//second light
var lPosition = lPosition1
var lAmbient2 = lPosition1
var lDiffuse2 = lPosition1
var lSpecular2 = lPosition1
var lEnabled2 = true;

//init to ruby material
var matAmbient = vec4(0.1745, 0.01175, 0.01175, 1.0);
var matDiffuse = vec4(0.61424, 0.04136, 0.04136, 1.0);
var matSpecular = vec4(0.727811, 0.626959, 0.626969, 1.0);
var matShininess = 60.0;


window.onload = function init() {

    // set up canvas
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Define viewport size and background color and enable zbuffering
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.9, 0.9, 0.9, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //init shaders and attributes
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    console.log("initial eye:"+viewer.eye);
    console.log("initial at:"+viewer.at);
    console.log("initial up:"+viewer.up);
	console.log("fov:"+perspProj.fov);
	console.log("aspect:"+perspProj.aspect);
	console.log("near:"+perspProj.near);
	console.log("far:"+perspProj.far);
    console.log("light position 1: "+lPosition1);
    console.log("light position 2:"+lPosition)

    translateLoc = gl.getUniformLocation(program, "translate");
    scaleLoc = gl.getUniformLocation(program, "scale");
    thetaLoc = gl.getUniformLocation(program, "theta");

    vNormal = gl.getAttribLocation(program, "vNormal");
    vPosition = gl.getAttribLocation(program, "vPosition");

    nBuffer = gl.createBuffer();
    vBuffer = gl.createBuffer();



    interaction();
    render();
};

	// ==============================================================================================
	// ==============================================================================================
	// ======================================================================
	// ========================== Interaction ============================================
function interaction() {

    document.getElementById("shape").onchange = function() {
        shape = document.getElementById("shape").value;
        interactionFlag = true;
    };

    //rotate buttons
    document.getElementById("rotS").onclick = function() {
        autoRotate = false;
    };
    document.getElementById("rotX").onclick = function() {
        axis = 0;
        autoRotate = true;
    };
    document.getElementById("rotY").onclick = function() {
        axis = 1;
		autoRotate = true;
    };
    document.getElementById("rotZ").onclick = function() {
        axis = 2;
        autoRotate = true;
    };


    //change material
    document.getElementById("matColor").onchange = function() {
        var matColor = document.getElementById("matColor").value;
        if (matColor == "ruby") {
            matAmbient = vec4(0.1745, 0.01175, 0.01175, 1.0);
            matDiffuse = vec4(0.61424, 0.04136, 0.04136, 1.0);
            matSpecular = vec4(0.727811, 0.626959, 0.626969, 1.0);
            matShininess = 60.0;
        }
        if (matColor == "gold") {
            matAmbient = vec4(0.24725, 0.1995, 0.0745, 1.0);
            matDiffuse = vec4(0.75164, 0.60648, 0.22648, 1.0);
            matSpecular = vec4(0.628281, 0.555802, 0.366065, 1.0);
            matShininess = 40.0;
        }
    };

    //change shininess
    document.getElementById("shiny").onchange = function() {
        var shininess = document.getElementById("shiny").value;
        matShininess = parseFloat(shininess);
    };

    document.getElementById("light1").onchange = function() {
        lEnabled1 = document.getElementById("light1").checked;
    };
    document.getElementById("light2").onchange = function() {
        lEnabled2 = document.getElementById("light2").checked;
    };



    // ==============================================================================================
    // ==============================================================================================
    // ==============================================================================================
    // ========================== Camera control via mouse
    //
    document.getElementById("gl-canvas").onmousedown = function(event) {
        if (event.button == 0 && !mouse.leftDown) {
            mouse.leftDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        } else if (event.button == 2 && !mouse.rightDown) {
            mouse.rightDown = true;
            mouse.prevX = event.clientX;
            mouse.prevY = event.clientY;
        }
    };

    document.getElementById("gl-canvas").onmouseup = function(event) {
        // Mouse is now up
        if (event.button == 0) {
            mouse.leftDown = false;
        } else if (event.button == 2) {
            mouse.rightDown = false;
        }
    };

    document.getElementById("gl-canvas").onmouseleave = function() {
        // Mouse is now up
        mouse.leftDown = false;
        mouse.rightDown = false;
    };


    document.getElementById("gl-canvas").onmousemove = function(event) {
        // Get changes in x and y
        var currentX = event.clientX;
        var currentY = event.clientY;

        var deltaX = event.clientX - mouse.prevX;
        var deltaY = event.clientY - mouse.prevY;

        var makeChange = 0;

        //console.log("enter onmousemove");
        //console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);

        // Only perform actions if the mouse is down
        // Compute camera rotation on left click and drag
        if (mouse.leftDown) {
            //console.log("onmousemove and leftDown is true");
            makeChange = 1;

            // Perform rotation of the camera
            if (viewer.up[1] > 0) {
                viewer.theta -= 0.01 * deltaX;
                viewer.phi -= 0.01 * deltaY;
            } else {
                viewer.theta += 0.01 * deltaX;
                viewer.phi -= 0.01 * deltaY;
            }

            //console.log("increment theta=",viewer.theta,"  phi=",viewer.phi);

            // Wrap the angles
            var twoPi = 6.28318530718;
            if (viewer.theta > twoPi) {
                viewer.theta -= twoPi;
            } else if (viewer.theta < 0) {
                viewer.theta += twoPi;
            }

            if (viewer.phi > twoPi) {
                viewer.phi -= twoPi;
            } else if (viewer.phi < 0) {
                viewer.phi += twoPi;
            }
            console.log("wrapped  theta=", viewer.theta, "  phi=", viewer.phi);

        } else if (mouse.rightDown) {
            //console.log("onmousemove and rightDown is true");
            makeChange = 1;
            // Perform zooming

            viewer.radius -= 0.01 * deltaX;

            viewer.radius = Math.max(0.1, viewer.radius);
        }

        if (makeChange == 1) {

            //console.log("onmousemove make changes to viewer");

            // Recompute eye and up for camera
            var threePiOver2 = 4.71238898;
            var piOver2 = 1.57079632679;

            var pi = 3.14159265359;

            var r = viewer.radius * Math.sin(viewer.phi + piOver2);


            viewer.eye = vec3(r * Math.cos(viewer.theta + piOver2), viewer.radius * Math.cos(viewer.phi + piOver2), r * Math.sin(viewer.theta + piOver2));

            //add vector (at - origin) to move 
            for (k = 0; k < 3; k++)
                viewer.eye[k] = viewer.eye[k] + viewer.at[k];

            //console.log("theta=",viewer.theta,"  phi=",viewer.phi);
            //console.log("eye = ",viewer.eye[0],viewer.eye[1],viewer.eye[2]);
            //console.log("at = ",viewer.at[0],viewer.at[1],viewer.at[2]);
            //console.log(" ");

            // move down -z axis ?????
            //viewer.eye[2] = viewer.eye[2] - viewer.radius;


            if (viewer.phi < piOver2 || viewer.phi > threePiOver2) {
                viewer.up = vec3(0.0, 1.0, 0.0);
            } else {
                viewer.up = vec3(0.0, -1.0, 0.0);
            }
            console.log("up = ", viewer.up[0], viewer.up[1], viewer.up[2]);
            //console.log("update viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);
            // Recompute the view
            mvMatrix = lookAt(vec3(viewer.eye), viewer.at, viewer.up);


            mouse.prevX = currentX;
            mouse.prevY = currentY;
            //setRotation();
        }
        //console.log("exit onmousemove");
        //console.log("viewer.eye = ",viewer.eye,"  viewer.at=",viewer.at,"  viewer.up=",viewer.up);


    };

}

//use in mouse interaction
function setRotation(inputAxis, inputRotate) {
    autoRotate = false;
    axis = inputAxis;
    theta[inputAxis] = parseFloat(inputRotate);
    gl.uniform3fv(thetaLoc, theta);
}


function drawShapes(inputPoints, inputTheta, inputTranslate, inputScale) {

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(nArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(inputPoints), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    //pre-compute lighting model products
    var ambientMult = mult(lAmbient1, matAmbient);
    var diffuseMult = mult(lDiffuse1, matDiffuse);
    var specularMult = mult(lSpecular1, matSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "ambientMult"), flatten(ambientMult));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseMult"), flatten(diffuseMult));
    gl.uniform4fv(gl.getUniformLocation(program, "specularMult"), flatten(specularMult));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), matShininess);

    gl.uniform4fv(gl.getUniformLocation(program, "lPosition1"), flatten(lPosition1));
    gl.uniform4fv(gl.getUniformLocation(program, "lPosition"), flatten(lPosition));

    gl.uniform1i(gl.getUniformLocation(program, "lEnabled1"), lEnabled1 ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, "lEnabled2"), lEnabled2 ? 1 : 0);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(proj));

    gl.uniform3fv(translateLoc, inputTranslate);
    gl.uniform3fv(scaleLoc, inputScale);

    if (autoRotate) inputTheta[axis] += 1.0;
    gl.uniform3fv(thetaLoc, inputTheta);

    gl.drawArrays(gl.TRIANGLES, 0, inputPoints.length);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //used instead of surface rev object to select shape
    if (interactionFlag) {
	    if (shape == "cylinder") {
	    	drawCylinder();
	    } else if (shape == "cone") {
	        drawCone();
	    }
        interactionFlag = false;
    }
    drawShapes(points, theta, translate, scale);
    requestAnimFrame(render);
}
