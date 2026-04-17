import { BoundingBox, Coords } from './Utility';

function distance(
  //computes the distance between two given points
  p1: Coords,
  p2: Coords //a helper in the compute_points method in which we compute the distance between two points
): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)); 
}

function normalize(v: Coords) {
  let mag: number = Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2))
  return {x: v.x / mag, y: v.y / mag}
}

function mid_point(p1: Coords, p2: Coords): Coords {
  //given a line, finds the midpoint of that line
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

export function lineAngle(p1: Coords, p2: Coords): number {
  if (p1.x == p2.x){
    return 90
  } else {
    let slope = (p1.y - p2.y)/(p1.x - p2.x)
    return Math.atan(slope)
  }
}

function get_minimum_distance(
  target_point: Coords,
  compare_points: Coords[]
): Coords {
  //given a set of coordinates and a single, target, point
  //returns the coordinates of the closest of the inputted points.
  let curr_min_point: Coords = compare_points[0];
  if (compare_points.length == 0) {
    throw Error(`Error: no points to compare. Please report this error.`);
  }
  compare_points.forEach((p) => {
    if (distance(p, target_point) < distance(curr_min_point, target_point)) {
      curr_min_point = p;
    }
  });
  return curr_min_point;
}

function bounding_box_to_lambda(
  boundingBox: BoundingBox
): (r: number) => Coords {
  //given a rectangle bound, returns a bounding box lambda (defined in visualObject)

  //no idea how to get inverse tangent
  //we'll call that function tangent

  //we create 4 quadrants of our rectangle - such quadrants are formed by
  //2 bisecting lines from opposite pairs of corners
  return (rinp: number) => {
    //shrink our radians down to the following
    const r = rinp % (2* Math.PI);
    // const s = r + " , "+ rinp;
    // throw s;

    //unfold the data a bit (note: each of these is a coords object)
    const topLeft: Coords = boundingBox.top_left;
    const bottomRight: Coords = boundingBox.bottom_right;

    const height = Math.abs(topLeft.y - bottomRight.y);
    const width = Math.abs(topLeft.x - bottomRight.x);

    //should be arcTan!!!!!!!
    //this gives the angle(in radians of the bisecting line going from
    //bottom left to top right)
    const barrierAngle = Math.atan(height / width);

    // throw barrierAngle;

    //Case 1: 0 <= r <= barrierAngle
    if (2 * Math.PI - barrierAngle <= r || r <= barrierAngle) {
      const xval = bottomRight.x;
      let yval: number;
      if (r > Math.PI) {
        yval = bottomRight.y - (height / 2) + (Math.tan(2*Math.PI - r) * width) / 2;
      } else {
        yval = bottomRight.y - (height) + (Math.tan(r) * width) / 2 ;

      }
      return { x: xval, y: yval };
    }
    //Case 2: barrierAngle < r < pi - barrierAngle
    else if (barrierAngle < r && r <= Math.PI - barrierAngle) {
      let xval: number;
      if (r > Math.PI/2) {
        xval = topLeft.x + height/(2*Math.tan(r - Math.PI/4));
      } else {
        xval = topLeft.x + width/2 + height/(2*Math.tan(r));
      }
      const yval = topLeft.y;
      return { x: xval, y: yval };
    }
    //Case 3: pi - barrierAngle <= r <= pi + barrierAngle
    else if (Math.PI - barrierAngle < r && r < Math.PI + barrierAngle) {
      const xval: number = topLeft.x;
      let yval: number;
      if (r < Math.PI) {
        yval = topLeft.y + height/2 - (width*Math.tan(Math.PI - r)/2)

        // yval = topLeft.y + height/2 - (width*Math.tan(Math.PI - r)/2)
      } else {
        yval = topLeft.y + height/2 + Math.abs((Math.tan(r - Math.PI) * width)) / 2;
      }

      return { x: xval, y: yval };
    }
    //Case 4: 2pi - barrierAngle < r < 2pi
    else if (Math.PI + barrierAngle < r || r < 2 * Math.PI - barrierAngle) {
      let xval: number;
      const yval = bottomRight.y;

      if (r < (3 * Math.PI) / 2) {
        xval = (bottomRight.x - width) + height * (Math.tan(3*Math.PI/2 - r))/2;
      } else {
        xval = (bottomRight.x - width/2) + height * (Math.tan(r - 3*Math.PI/2))/2;
      }
      return { x: xval, y: yval };
    } else {
      throw Error('Error in geometricHelpers.ts; Please report this error.');
    }
  };
}

export function leftMost(S:Coords[]){
  //get furthest left point
  //surely there isn't a faster way to do this
  const compareFunc = (a:Coords,b:Coords) => {
    if(a.x > b.x){
      return 1;
    }
    else if (b.x > a.x) {
      return -1;
    }
    else{
      return 0;
    }
  }
	return(S.sort(compareFunc)[0])
}

function mag(v:Coords){
  //magnitude
	return Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2));
}

function xprod(v1:Coords,v2:Coords){
  //dot product
	return v1.x*v2.x + v1.y*v2.y
}

export function ang(v1:Coords, v2:Coords){
  //return angle between two points (returning infinity of the points are on
  //the same line). This should technically be 0, but we want to disincentivize the algo
  //from including such points in our hull so we make it infinity for sake of algo
	const x = xprod(v1,v2)/(mag(v1)*mag(v2));
  
  if(mag(v1)*mag(v2) == 0){
  	return Infinity
  }
	return Math.acos(x)
}

export function jarvisAlgo(S:Coords[]){
		let hull:Coords[] = [] //the hull that we will populate
    let disqualified_points = new Set<Coords>();
   	
    hull.push(leftMost(S)) //first point in hull is leftmost point
    let i = 0;
    while(i == 0 || !(hull[i].x == hull[0].x && hull[i].y == hull[0].y)){
    	let oldVec:Coords;
			if(i == 0){
      	oldVec = {x:0, y:1}
      }
      else{
      	oldVec = {x: hull[i].x - hull[i-1].x, y: hull[i].y - hull[i-1].y}
        disqualified_points.add({x:hull[i].x, y:hull[i].y});
      }
            
      let currNextVec = {x:0,y:0}; 
      let currMinAngle = 2*Math.PI; //dummy angle, vector point to get algo started
      
      S.forEach(s => { //iterate through points, finding point that gives
        //minimum angle between "currVec" (vector between prior point and currpoint) and "candVec",
        //(vector between current point and candidate next point)
      		if(!disqualified_points.has({x:s.x, y:s.y})){
          	let candVec = {x: s.x - hull[i].x, y: s.y - hull[i].y}
          	let candAng = ang(oldVec, candVec)
          	if(candAng < currMinAngle || (currNextVec.x ==hull[i].x && currNextVec.y == hull[i].y) ){
            	currNextVec = s;
            	currMinAngle = candAng;
          }
          }
        
      })
      i++;
     	hull.push(currNextVec);
 			
    }
    return hull;
}

///////////////////////////////////////////
// SVG Arc conversion
///////////////////////////////////////////

// TODO: this needs more review; adding for experimental purposes

export interface ArcEndpointParameterization {
  x1: number, 
  y1: number, 
  rx: number, 
  ry: number, 
  phi: number, 
  fA: boolean, 
  fS: boolean, 
  x2: number, 
  y2: number
}

export interface ArcCenterParameterization {
  cx: number,
  cy: number,
  startAngle: number,
  deltaAngle: number,
  endAngle: number,
  clockwise: boolean
}

export interface ScaledRadii {
  rx: number,
  ry: number
}

function findAngleRadians( ux: number, uy: number, vx: number, vy: number ): number {
  const  dot = ux * vx + uy * vy;
  const  mod = Math.sqrt( ( ux * ux + uy * uy ) * ( vx * vx + vy * vy ) );
  let  rad = Math.acos( dot / mod );
  if( ux * vy - uy * vx < 0.0 ) {
      rad = -rad;
  }
  return rad;
}

/**
 * 
 * Convert an endpoint parameterization (SVG) to a center parameterization
 * Docs: https://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
 * Conversion process: https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
 *
 * Code adapted from "cuixiping": https://stackoverflow.com/questions/9017100/calculate-center-of-svg-arc
 *    with modifications and comments by TN
 * 
 */
export function svgArcEndpointToCenter(
    {x1, y1, rx, ry, phi, fA, fS, x2, y2}: ArcEndpointParameterization): 
    ArcCenterParameterization & ScaledRadii {

  // Output variables
  let cx, cy, startAngle, deltaAngle, endAngle;
  const PIx2 = Math.PI * 2.0;

  /////////////////////////////////////////////////////
  // Correction of out-of-range radii
  // F.6.6 Step 1: Ensure the radii are non-zero
  if (rx == 0.0 || ry == 0.0) { 
    throw Error('rx and ry can not be 0');
  }

  // F.6.6 Step 2: Ensure radii are positive
  if (rx < 0) {
      rx = -rx;
  }
  if (ry < 0) {
      ry = -ry;
  }

  const s_phi = Math.sin(phi);
  const c_phi = Math.cos(phi);
  const hd_x = (x1 - x2) / 2.0; // half diff of x
  const hd_y = (y1 - y2) / 2.0; // half diff of y
  const hs_x = (x1 + x2) / 2.0; // half sum of x
  const hs_y = (y1 + y2) / 2.0; // half sum of y

  // F6.5.1
  const x1_ = c_phi * hd_x + s_phi * hd_y;
  const y1_ = c_phi * hd_y - s_phi * hd_x;

  // F.6.6 Correction of out-of-range radii
  //   Step 3: Ensure radii are large enough
  const lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
  if (lambda > 1) {
      rx = rx * Math.sqrt(lambda);
      ry = ry * Math.sqrt(lambda);
  }

  // F.6.6. Step 4: Proceed with computations
  ////////////////////////////////////////////////////

  var rxry = rx * ry;
  var rxy1_ = rx * y1_;
  var ryx1_ = ry * x1_;
  var sum_of_sq = rxy1_ * rxy1_ + ryx1_ * ryx1_; // sum of square
  if (!sum_of_sq) {
      throw Error('start point can not be same as end point');
  }
  var coe = Math.sqrt(Math.abs((rxry * rxry - sum_of_sq) / sum_of_sq));
  if (fA == fS) { coe = -coe; }

  // F6.5.2
  var cx_ = coe * rxy1_ / ry;
  var cy_ = -coe * ryx1_ / rx;

  // F6.5.3
  cx = c_phi * cx_ - s_phi * cy_ + hs_x;
  cy = s_phi * cx_ + c_phi * cy_ + hs_y;

  var xcr1 = (x1_ - cx_) / rx;
  var xcr2 = (x1_ + cx_) / rx;
  var ycr1 = (y1_ - cy_) / ry;
  var ycr2 = (y1_ + cy_) / ry;

  // F6.5.5
  startAngle = findAngleRadians(1.0, 0.0, xcr1, ycr1);

  // F6.5.6
  deltaAngle = findAngleRadians(xcr1, ycr1, -xcr2, -ycr2);
  while (deltaAngle > PIx2) { deltaAngle -= PIx2; }
  while (deltaAngle < 0.0) { deltaAngle += PIx2; }
  if (fS == false) { deltaAngle -= PIx2; }
  endAngle = startAngle + deltaAngle;
  while (endAngle > PIx2) { endAngle -= PIx2; }
  while (endAngle < 0.0) { endAngle += PIx2; }

  return {
      cx: cx,
      cy: cy,
      startAngle: startAngle,
      deltaAngle: deltaAngle,
      endAngle: endAngle,
      clockwise: (fS == true),
      // Report back the radii, in case they needed to be scaled
      rx: rx,
      ry: ry
  }


}

///////////////////////////////////////////////

export { distance, mid_point, get_minimum_distance, bounding_box_to_lambda, normalize};
