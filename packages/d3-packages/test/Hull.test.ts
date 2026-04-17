import { jarvisAlgo, ang, leftMost } from '../geometricHelpers';
import { Coords } from '../Utility';

describe('Hull integration tests', () => {
  it('Works in small example', () => {
    const pts = [
      { x: 0, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 100, y: 0 },
      { x: 100, y: 0.8 },
      { x: 80, y: 100 },
      { x: 120, y: 100 }
    ];
    //simple diamond that encircles several points. Want that hull is just this
    //outer diamond (not inner points)
  
    const hull = jarvisAlgo(pts);
    const expectedHull = [
      { x: 0, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 100, y: 0 }
    ];
  
    hull.forEach((p) => {
      expect(expectedHull).toContainEqual({ x: p.x, y: p.y });
    });
    expectedHull.forEach((p) => {
      expect(hull).toContainEqual({ x: p.x, y: p.y });
    });
  })
  it('Works in larger example', () => {
    //we construct a larger example of the above
    //see here: 
    //<iframe src="https://www.geogebra.org/calculator/fx95xd6e?embed" width="800" height="600" allowfullscreen style="border: 1px solid #e4e4e4;border-radius: 4px;" frameborder="0"></iframe>
    //and verify that algorithm still works

    const pts = [
      {x:-3, y:2.7}, {x:3.9,y:2.1}, {x:4.4,y:-2.8}, {x:.7,y:-4.1},
      {x:-3.9, y:-4.1}, {x:-5.3, y:-0.8}, {x:-2.6, y:.5}, {x:.8,y:1.7},
      {x:-.8,y:-.4}, {x:2.7,y:-.4}, {x:-.8, y:-2.1}
    ]
    const hull = jarvisAlgo(pts);
    const expectedHull = [
      {x:-3, y:2.7}, {x:3.9,y:2.1}, {x:4.4,y:-2.8}, {x:.7,y:-4.1},
      {x:-3.9, y:-4.1}, {x:-5.3, y:-0.8}
    ]
    hull.forEach((p) => {
      expect(expectedHull).toContainEqual({ x: p.x, y: p.y });
    });
    expectedHull.forEach((p) => {
      expect(hull).toContainEqual({ x: p.x, y: p.y });
    });

  })

});

describe('Helper unit tests', () => {
  //the two non-trivial helpers are ang and leftMost

  //LeftMost tests ----------------------------------------------
  it('gets leftMost Point case general', () => {
    const pts = [
      { x: 0, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 100, y: 0 },
      { x: 100, y: 0.8 },
      { x: 80, y: 100 },
      { x: 120, y: 100 }
    ];
    const leftPt = leftMost(pts);
    const expectedX = 0;
    expect(leftPt.x).toBe(expectedX);
  });
  it('gets leftMost Point case one point', () => {
    const pts = [{ x: 2, y: 10 }];
    const leftPt = leftMost(pts);
    const expectedX = 2;
    expect(leftPt.x).toBe(expectedX);
  });
  it('gets leftMost Point case multiple points', () => {
    const pts = [
      { x: 0, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 100 },
      { x: 100, y: 0 },
      { x: 100, y: 0.8 },
      { x: 0, y: 100 },
      { x: 120, y: 100 }
    ];
    const leftPt = leftMost(pts);
    const expectedX = 0;
    expect(leftPt.x).toBe(expectedX);
  });
  //Ang tests ----------------------------------------------
  //I just hand computed some angles and verified that behavior in function ang
  it('correctly computes angle case1', () => {
    const v1 = { x: 0, y: 1 };
    const v2 = { x: 1, y: 0 };

    const testAng = ang(v1, v2);
    const expectedAng = Math.PI / 2;

    expect(expectedAng).toBeCloseTo(testAng, 3);
  });
  it('correctly computes angle case2', () => {
    const v1 = { x: 0, y: 1 };
    const v2 = { x: 1, y: 1 };

    const testAng = ang(v1, v2);
    const expectedAng = Math.PI / 4;

    expect(expectedAng).toBeCloseTo(testAng, 3);
  });
  it('correctly computes angle case3', () => {
    const v1 = { x: 0, y: -1 };
    const v2 = { x: 0, y: 1 };

    const testAng = ang(v1, v2);
    const expectedAng = Math.PI;

    expect(expectedAng).toBeCloseTo(testAng, 3);
  });
  it('correctly computes angle case4', () => {
    const v1 = { x: -1, y: -1 };
    const v2 = { x: 0, y: 1 };

    const testAng = ang(v1, v2);
    const expectedAng = (3 * Math.PI) / 4;

    expect(expectedAng).toBeCloseTo(testAng, 3);
  });
});
