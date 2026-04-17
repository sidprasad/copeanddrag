import { require as d3require } from 'd3-require';

export function fetchLibrary(library: string): Promise<any> {
  return d3require(library);
}
