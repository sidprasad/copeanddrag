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

describe('parseAlloyXML loopBack derivation', () => {
  // Minimal builtin sigs so instanceFromElement can populate the Int type.
  const SIGS =
    '<sig label="Int" ID="1" parentID="2" builtin="yes"></sig><sig label="univ" ID="2" builtin="yes"></sig>';
  const instance = (attrs: string) => `<instance bitwidth="4" ${attrs}>${SIGS}</instance>`;
  const trace = (attrs: string) => `<alloy>${instance(attrs)}${instance(attrs)}</alloy>`;

  it('derives loopBack = tracelength - looplength from Alloy-native XML (no backloop/loop)', () => {
    expect(parseAlloyXML(trace('tracelength="4" looplength="2"')).loopBack).toBe(2);
    expect(parseAlloyXML(trace('tracelength="5" looplength="2"')).loopBack).toBe(3);
  });

  it('prefers backloop, then loop, over looplength', () => {
    expect(parseAlloyXML(trace('tracelength="4" looplength="2" backloop="3"')).loopBack).toBe(3);
    expect(parseAlloyXML(trace('tracelength="4" looplength="2" loop="1"')).loopBack).toBe(1);
  });

  it('does not treat a static instance (tracelength=1 looplength=1) as a trace', () => {
    expect(parseAlloyXML(`<alloy>${instance('tracelength="1" looplength="1"')}</alloy>`).loopBack).toBeUndefined();
  });
});
