
/*
 * Jacquelin Huang
 */


var objects = [];
var points = [];
var colors = [];
var nArray = [];

var objRadius = 0.5;
var objHeight = 0.5;
var slices = 32;

function resetArrays() {
 colors = [];
 points = [];
}

function setColor() {
    //any color will do
    return [1.0, 1.0, 1.0, 1.0];
}


function getColor(color){   
    return (color == null) ? setColor() : color;
}

//cone vertices and color
function drawCone(){
    resetArrays();
    var length = 0.5*objHeight;
    var vTop = vec4(0.0, length, 0.0, 1.0);
    var vBot = vec4(0.0, -length, 0.0, 1.0);
    var vecs = makeCircle(objRadius, -length);
    var colTriTop;
    var colTriBot;
    colTriTop = setColor();
    colTriBot = colTriTop;
    
    for (var i = 0; i < vecs.length - 1; i++) {
        makeTriangle(vecs[i + 1], vTop, vecs[i], colTriTop);
    }
    pushCircle(vecs, vBot, colTriBot);
}

//cylinder vertices and color
function drawCylinder(){
    resetArrays();
    
    var length = 0.5*objHeight;
    var vTop = vec4(0.0, length, 0.0, 1.0);
    var vBot = vec4(0.0, -length, 0.0, 1.0);
    var vecsTop = makeCircle(objRadius, length);
    var vecsBot = makeCircle(objRadius, -length);

    var colTriTop;
    var colTriBot;
    var colTriS1; 
    var colTripS2; 
    colTriTop = setColor();
    colTriBot = colTriTop;
    colTriS1 = colTriTop;
    colTripS2 = colTriTop;

    for (var i = 0; i < vecsTop.length - 1; i++) {
        makeSquare(vecsTop[i + 1], vecsTop[i], vecsBot[i], vecsBot[i + 1], colTriS1, colTripS2);
    }
    
    pushCircle(vecsTop, vTop, colTriTop);
    pushCircle(vecsBot, vBot, colTriBot);    
}

//used for top and bottom of cyclinder and cone
function makeCircle(radius, height) {
	var phi = 2.0 * Math.PI / slices;
	var vecs = [];

	for (var i = 0; i < slices; i++) {
		var angle = i * phi;
		vecs.push(vec4(radius * Math.cos(angle), height, radius * Math.sin(angle), 1.0));
	}
	vecs.push(vecs[0]); 

	return vecs;
}

function pushCircle(vecs, mid, triangleColor) {

	for (var i = 0; i < vecs.length - 1; i++) {
		
		var color = getColor(triangleColor);
		
		if(mid>0) {
			pushShape([vecs[i], vecs[i + 1], mid], color);
		} else {
			pushShape([vecs[i], mid, vecs[i + 1]], color);
		}		
	}
}

//normalice vertices
function pushShape(pt, c1) {
    var p0 = pt[0];
    var p1 = pt[1];
    var p2 = pt[2];
                
    var t1 = subtract(p1, p0);
    var t2 = subtract(p2, p0);
    var normal = normalize(vec3(cross(t2, t1)));        
            
    for (var i = 0; i < pt.length; ++i) {
        colors.push(c1);
        points.push(pt[i]);
        nArray.push(normal);
    }   
}

//used for cylinder face
function makeSquare(a, b, c, d, c1, c2) {
	var color1 = getColor(c1);
	var color2 = getColor(c2);
	
	pushShape([a, b, c], color1);
	pushShape([a, c, d], color2);
}

//used for cone face
function makeTriangle(a, b, c, c1) {
	var color = getColor(c1);
	pushShape([a, b, c], color);
}

//calculate normal vector
function normVec(vec, l) {
    var len = vecLength(vec)/l;
    return vec4(vec[0]/len, vec[1]/len, vec[2]/len, vec[3]);
}
//calculate length of vector
function vecLength(vec) {
    return Math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2]);
}
