/**
 * @jest-environment jsdom
 */
import { AlloySignature } from '../AlloySignature'
import { AlloyProxy } from '../AlloyProxy'

// An instance with a subset (`in`) signature: `Active in Node`. Alloy's XML lists Active's member
// atoms (Node$0, Node$1) which already belong to the parent sig Node, and marks the subset with a
// <type> child. Parsing this used to throw "Cannot apply proxy, ID already exists: Node$0".
const SUBSET_XML = `<instance bitwidth="4">
  <sig label="univ" ID="2" builtin="yes"></sig>
  <sig label="this/Node" ID="4" parentID="2">
    <atom label="Node$0"/><atom label="Node$1"/><atom label="Node$2"/>
  </sig>
  <sig label="this/Active" ID="5" var="yes">
    <atom label="Node$0"/><atom label="Node$1"/>
    <type ID="4"/>
  </sig>
</instance>`

function parseSigs(): Map<string, AlloySignature> {
  const doc = new DOMParser().parseFromString(SUBSET_XML, 'text/xml')
  const instance = doc.querySelector('instance')!
  return AlloySignature.signaturesFromXML(instance, new AlloyProxy())
}

describe('signaturesFromXML with subset (`in`) signatures', () => {
  it('does not throw when an atom appears under both a parent sig and an `in` subset sig', () => {
    expect(() => parseSigs()).not.toThrow()
  })

  it('the subset sig contains the shared atoms', () => {
    const sigs = parseSigs()
    const active = sigs.get('5')!
    expect(active.atoms().map(a => a.id()).sort()).toEqual(['Node$0', 'Node$1'])
  })

  it('reuses the parent atom objects rather than duplicating them', () => {
    const sigs = parseSigs()
    const node = sigs.get('4')!
    const active = sigs.get('5')!
    expect(active.atom('Node$0')).toBe(node.atom('Node$0'))
  })
})
