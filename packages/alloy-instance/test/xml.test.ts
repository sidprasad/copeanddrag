/** @jest-environment jsdom */
import { describe, expect, it } from '@jest/globals';
import { getInstanceAtoms, getInstanceTypes, parseAlloyXML } from '../index';
import rcXml from '../../../demos/rc/rc-datum.xml';

describe('parseAlloyXML on the rc fixture', () => {
  it('produces a 12-instance trace', () => {
    const datum = parseAlloyXML(rcXml);
    expect(datum.instances).toHaveLength(12);
  });

  it('reads top-level Alloy attributes from the first instance', () => {
    const datum = parseAlloyXML(rcXml);
    expect(datum.bitwidth).toBe(4);
    expect(datum.command).toBe('temporary-name_rc_1');
    expect(datum.loopBack).toBe(10);
  });

  it('exposes the river-crossing signatures in the first instance', () => {
    const datum = parseAlloyXML(rcXml);
    const ids = getInstanceTypes(datum.instances[0]).map((t) => t.id);
    expect(ids).toEqual(
      expect.arrayContaining(['GWBoat', 'GWAnimal', 'Goat', 'Wolf', 'Position', 'Near', 'Far'])
    );
  });

  it('exposes the expected atoms in the first instance', () => {
    const datum = parseAlloyXML(rcXml);
    const ids = getInstanceAtoms(datum.instances[0]).map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'GWBoat0',
        'Goat0', 'Goat1', 'Goat2',
        'Wolf0', 'Wolf1', 'Wolf2',
        'Near0', 'Far0'
      ])
    );
  });

  it('throws when there is no <instance> element', () => {
    expect(() => parseAlloyXML('<alloy></alloy>')).toThrow(/No Alloy instance/);
  });

  it('parses deterministically (same input → structurally equal trace shape)', () => {
    const a = parseAlloyXML(rcXml);
    const b = parseAlloyXML(rcXml);
    expect(a.instances.length).toBe(b.instances.length);
    expect(a.bitwidth).toBe(b.bitwidth);
    expect(a.command).toBe(b.command);
    expect(a.loopBack).toBe(b.loopBack);
    for (let i = 0; i < a.instances.length; i++) {
      expect(getInstanceAtoms(a.instances[i]).map((x) => x.id).sort()).toEqual(
        getInstanceAtoms(b.instances[i]).map((x) => x.id).sort()
      );
    }
  });
});
