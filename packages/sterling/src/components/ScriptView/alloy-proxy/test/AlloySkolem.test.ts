/**
 * @jest-environment jsdom
 */

import {AlloyTuple} from '../AlloySet'
// Must import these, or clash with .d.ts version (TODO: resolve conflict)
import {AlloySignature} from '../AlloySignature'
import {AlloyAtom} from '../AlloyAtom'
import {AlloySkolem} from '../AlloySkolem'

const atomA0 = new AlloyAtom('A$0')
const atomA1 = new AlloyAtom('A$1')
const atomA2 = new AlloyAtom('A$2')
const atomB0 = new AlloyAtom('B$0')
const atomB1 = new AlloyAtom('B$1')
const atomB2 = new AlloyAtom('B$2')
const sigANoProxy = new AlloySignature('A', [atomA0, atomA1, atomA2])
const sigBNoProxy = new AlloySignature('B', [atomB0, atomB1, atomB2])

describe('AlloySkolem skolemsFromXML', () => {    
    
    it('test single (XML) Skolem tuple, single (pre-constructed) type', () => {
      const parser = new DOMParser();
      
      const xml: string = `
   <test>
     <skolem label="$x" ID="100">
        <tuple> <atom label="A$0"/> </tuple>
        <types> <type ID="3"/> </types>
     </skolem>
   </test>`
      const parsed: Document = parser.parseFromString(xml, 'text/xml')
      const inst = parsed.querySelector('test') as Element
      const sigMap = new Map()
      sigMap.set('3', sigANoProxy)
      sigMap.set('4', sigBNoProxy)

      // test with no proxy
      const skolemsNoProxy: AlloySkolem[] = AlloySkolem.skolemsFromXML(inst, sigMap)

      expect(skolemsNoProxy.length).toBe(1)
      expect(skolemsNoProxy[0].id()).toBe('$x')
      expect(skolemsNoProxy[0].tuples().length).toBe(1)
      expect(skolemsNoProxy[0].types().length).toBe(1)
      expect(skolemsNoProxy[0].types()[0].length).toBe(1)
      expect(skolemsNoProxy[0].types()[0][0]).toBe(sigANoProxy)
      expect(skolemsNoProxy[0].tuples()[0].atoms().length).toBe(1)
      expect(skolemsNoProxy[0].tuples()[0].atoms()[0].id()).toBe('A$0')
      
    })

    it('test multiple (XML) Skolem tuples, two (pre-constructed) types', () => {
        const parser = new DOMParser();
        
        const xml: string = `
        <test>
          <skolem label="$y_2" ID="100">
            <tuple> <atom label="A$0"/> <atom label="A$2"/> </tuple>
            <tuple> <atom label="A$1"/> <atom label="B$1"/> </tuple>
            <types> <type ID="3"/> <type ID="3"/> </types>
            <types> <type ID="3"/> <type ID="4"/> </types>
          </skolem>
        </test>`
           const parsed: Document = parser.parseFromString(xml, 'text/xml')
           const inst = parsed.querySelector('test') as Element
           const sigMap = new Map()
           sigMap.set('3', sigANoProxy)
           sigMap.set('4', sigBNoProxy)
     
           // test with no proxy
           const skolemsNoProxy: AlloySkolem[] = AlloySkolem.skolemsFromXML(inst, sigMap)
     
           expect(skolemsNoProxy.length).toBe(1)
           expect(skolemsNoProxy[0].id()).toBe('$y_2')
           // Recall: .toBe tests for _object equality_
           expect(skolemsNoProxy[0].tuples().length).toBe(2)
           expect(skolemsNoProxy[0].types().length).toBe(2)
           // Recall: .toEqual recurs into object fields and array elements
           expect(skolemsNoProxy[0].types()[0]).toEqual([sigANoProxy, sigANoProxy])
           expect(skolemsNoProxy[0].types()[1]).toEqual([sigANoProxy, sigBNoProxy])
           expect(skolemsNoProxy[0].tuples()[0].atoms()).toEqual([atomA0, atomA2])
           expect(skolemsNoProxy[0].tuples()[1].atoms()).toEqual([atomA1, atomB1])
    })

});

describe('AlloySkolem clone', () => {    
  
    it('test AlloySkolem clone()', () => {
        const skolem1: AlloySkolem = new AlloySkolem('x', [[sigANoProxy]], [new AlloyTuple([atomA0])])
        const skolem1c = skolem1.clone([sigANoProxy])
        
        const skolem2: AlloySkolem = new AlloySkolem('y', 
            [[sigANoProxy, sigANoProxy],[sigANoProxy, sigBNoProxy]], 
            [new AlloyTuple([atomA0, atomA1]), new AlloyTuple([atomA2, atomB1])])
        const skolem2c = skolem2.clone([sigANoProxy])

        expect(skolem1c.id()).toBe('x')
        expect(skolem1c.tuples().length).toBe(1)
        expect(skolem1c.types().length).toBe(1)
        expect(skolem1c.types()[0]).toEqual([sigANoProxy])        
        expect(skolem1c.tuples()[0].atoms()).toEqual([atomA0])        

        expect(skolem2c.id()).toBe('y')
        expect(skolem2c.tuples().length).toBe(2)
        expect(skolem2c.types().length).toBe(2)
        expect(skolem2c.types()[0]).toEqual([sigANoProxy, sigANoProxy])
        expect(skolem2c.types()[1]).toEqual([sigANoProxy, sigBNoProxy])
        expect(skolem2c.tuples()[0].atoms()).toEqual([atomA0, atomA1])
        expect(skolem2c.tuples()[1].atoms()).toEqual([atomA2, atomB1])

        
        
      })

})
  