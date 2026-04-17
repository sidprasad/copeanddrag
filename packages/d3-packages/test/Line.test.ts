import {Line} from '../Line'

test("trivial test to check Jest install", () => {
  const tsOne: number = 1
  expect(1).toBe(tsOne);
});

test("instantiate Line", () => {
  const aLine: Line = new Line({points: [{x: 0, y: 0}, {x: 10, y: 10}]})
  expect(aLine).toBe(aLine); // trivial check
})
