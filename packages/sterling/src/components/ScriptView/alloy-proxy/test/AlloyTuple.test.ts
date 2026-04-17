/**
 * @jest-environment jsdom
 */

import {AlloyTuple} from '../AlloySet'
// Must import these, or clash with .d.ts version (TODO: resolve conflict)
import {AlloySignature} from '../AlloySignature'
import {AlloyAtom} from '../AlloyAtom'

const atomA0 = new AlloyAtom('A$0')
const atomA1 = new AlloyAtom('A$1')
const atomA2 = new AlloyAtom('A$2')
const atomB0 = new AlloyAtom('B$0')
const atomB1 = new AlloyAtom('B$1')
const atomB2 = new AlloyAtom('B$2')
const sigANoProxy = new AlloySignature('A', [atomA0, atomA1, atomA2])
const sigBNoProxy = new AlloySignature('B', [atomB0, atomB1, atomB2])

describe('AlloyTuple.tuplesFromXML', () => {    
    
    it('test single (XML) tuple, single (pre-constructed) type', () => {
      const parser = new DOMParser();
      
      const xml: string = `
    <test>
      <tuple> <atom label="A$0"/> <atom label="A$1"/> <atom label="A$2"/></tuple>
   </test>`
      const parsed: Document = parser.parseFromString(xml, 'text/xml')
      
      const tuples: AlloyTuple[] = AlloyTuple.tuplesFromXML(
        parsed.querySelectorAll('tuple'), 
        [[sigANoProxy, sigANoProxy, sigANoProxy]])
      expect(tuples.length).toBe(1)
      expect(tuples[0].atoms().length).toBe(3)
      expect(tuples[0].atoms()[0].id()).toBe('A$0')
      expect(tuples[0].atoms()[1].id()).toBe('A$1')
      expect(tuples[0].atoms()[2].id()).toBe('A$2')
      
    })

    it('test multiple (XML) tuple, two (pre-constructed) types', () => {
        const parser = new DOMParser();
        
        const xml: string = `
      <test>
        <tuple> <atom label="A$0"/> <atom label="A$1"/> <atom label="A$2"/></tuple>
        <tuple> <atom label="A$0"/> <atom label="A$1"/> <atom label="B$0"/></tuple>
     </test>`
        const parsed: Document = parser.parseFromString(xml, 'text/xml')
        
        const tuples: AlloyTuple[] = AlloyTuple.tuplesFromXML(
          parsed.querySelectorAll('tuple'), 
          [[sigANoProxy, sigANoProxy, sigANoProxy],
           [sigANoProxy, sigANoProxy, sigBNoProxy]])
        expect(tuples.length).toBe(2)
        expect(tuples[0].atoms().length).toBe(3)
        expect(tuples[1].atoms().length).toBe(3)
        expect(tuples[0].atoms()[2].id()).toBe('A$2')
        expect(tuples[1].atoms()[2].id()).toBe('B$0')
      })
  
});
  