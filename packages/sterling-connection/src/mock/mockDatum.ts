import { getActiveFixture } from './fixtures';

export function getMockXml(): string {
  return getActiveFixture().fixture.xml;
}
