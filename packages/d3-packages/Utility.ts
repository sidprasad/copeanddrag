/**
 * This is going to be a generic utility file. Primarily for factoring
 * out algorithms with a higher level of computational complexity.
 */

export function toFunc<T>(defaultValue: T, t?: T | (() => T)): (() => T)  {
    //console.log(`toFunc: t=${JSON.stringify(t)} ??=${JSON.stringify(t ?? defaultValue)}`)
    let constOrFunction: T | (() => T) = t ?? defaultValue
    // This will require a typecast below:
    //if (typeof constOrFunction !== "function") {
    // This does not:
    if(!(constOrFunction instanceof Function)) {
        let constVal: T = constOrFunction      
        return () => constVal
    } else {
        // Note that this sort of narrowing will NOT work in the case of T 
        // being a function type itself! It has to be something else.
        return constOrFunction
    }
}

export interface Coords {
    x: number;
    y: number;
}

/**
 * Generic props for representing a box around an object.
 */
export interface BoundingBox {
    top_left: Coords;
    bottom_right: Coords;
  }

export function boxUnion(boxes: BoundingBox[]) {
    return {
        top_left: {
          x: Math.min(...boxes.map((box: BoundingBox): number => {return box.top_left.x })),
          y: Math.min(...boxes.map((box: BoundingBox): number => {return box.top_left.y }))
        },
        bottom_right: {
          x: Math.max(...boxes.map((box: BoundingBox): number => {return box.bottom_right.x })),
          y: Math.max(...boxes.map((box: BoundingBox): number => {return box.bottom_right.y }))
        }
      }
}
  
export interface ExperimentalBoundingBox {
    lambda: (radians: number) => Coords;
}

/**
 * Simple method averaging the coordinate points in a series.
 * @param points
 * @returns
 */
export function averagePath(points: Coords[]): Coords {
    if (points == undefined) {
      return { x: 0, y: 0 };
    }
    if (points.length == 0) {
      return { x: 0, y: 0 };
    }
    //Averages the points
    return points.reduce(
      (previousValue: Coords, currentValue: Coords) => {
        return {
          x: previousValue.x + currentValue.x / points.length,
          y: previousValue.y + currentValue.y / points.length
        };
      },
      { x: 0, y: 0 }
    );
  }

  
  /**
   * Shifts a function list of points according to a shift variable
   * @param pointList
   * @param shift
   * @returns
   */
  export function shiftList(pointList: (() => Coords)[], shift: () => Coords): (() => Coords)[] {
    let newPoints: (() => Coords)[] = pointList.map((pointFn: () => Coords): (() => Coords) => {
      return () => { return {
        x: pointFn().x - shift().x,
        y: pointFn().y - shift().y
      }} ;
    });
    return newPoints;
  }
  
  /**
   * Utility function returning bounding box for a list of points
   * @param pointList list of points as coords
   * @returns bounding box
   */
  export function boundsOfList(pointList: Coords[]): BoundingBox {
    let x_min = Infinity;
    let y_min = Infinity;
    let x_max = -Infinity;
    let y_max = -Infinity;
    pointList.forEach((point) => {
      x_min = Math.min(x_min, point.x);
      x_max = Math.max(x_max, point.x);
      y_min = Math.min(y_min, point.y);
      y_max = Math.max(y_max, point.y);
    });
    return {
      top_left: { x: x_min, y: y_min },
      bottom_right: { x: x_max, y: y_max }
    };
  }  

  function instanceOfCoords(object: any): object is Coords {
    return 'x' in object && 'y' in object;
  }

  export function pointsOnBorder(lam: (r:number) =>Coords, precision: number): Coords[]{
    const boundary_points: Coords[] = [];
    for (let i = 1; i <= precision; i++) {
      const boundary_point = lam(((2 * Math.PI) / precision) * i);
      if (instanceOfCoords(boundary_point)) {
        boundary_points.push(boundary_point);
      } else {
        throw 'returned bounding box response not of type coords. Issue in edge.ts or utility.ts';
      }
    }

    return boundary_points;
  }