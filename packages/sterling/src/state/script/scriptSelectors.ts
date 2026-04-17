import { isAlloyDatumTrace } from '@/alloy-instance';
import { DatumParsed, isDatumAlloy } from '@/sterling-connection';
import { Projection } from '@/sterling-theme';
import {scriptViewImports} from '../../../../d3-packages/ScriptViewImports'
import { isDatumRaw } from '../../../../sterling-connection/src/parse/raw';
import { AlloyAtom } from '../../components/ScriptView/alloy-proxy/AlloyAtom';
import { AlloyInstance } from '../../components/ScriptView/alloy-proxy/AlloyInstance';
import { ScriptStageType, ScriptState, ScriptVariable } from './script';

function selectScriptStage(state: ScriptState): ScriptStageType {
  return state.stage;
}

function selectScriptStageDimensions(state: ScriptState): {
  width: number;
  height: number;
} {
  return state.stageDimensions;
}

function selectScriptText(state: ScriptState): string {
  return state.text;
}

const INSTANCE_URL =
  'https://alloy-js.github.io/alloy-ts/classes/alloyinstance.alloyinstance-1.html';
const SIG_URL =
  'https://alloy-js.github.io/alloy-ts/classes/alloysignature.alloysignature-1.html';
const ATOM_URL =
  'https://alloy-js.github.io/alloy-ts/classes/alloyatom.alloyatom-1.html';
const FIELD_URL =
  'https://alloy-js.github.io/alloy-ts/classes/alloyfield.alloyfield-1.html';
const SKOLEM_URL =
  'https://alloy-js.github.io/alloy-ts/classes/alloyskolem.alloyskolem-1.html';
const D3_HELPER_URL =
  'https://csci1710.github.io/forge-documentation/sterling/d3fx.html';

function selectScriptVariables(
  datum: DatumParsed<any>,
  projections: Projection[],
  time: number
): ScriptVariable[] {
  if (isDatumAlloy(datum)) {
    // get the unparsed text
    const text = datum.data;

    // generate AlloyInstance object for each <instance/>
    const instances = datum.parsed.instances.map(
      (_, index) => new AlloyInstance(text, index)
    );

    // get the current AlloyInstance object and project
    const instance = instances[time];
    const instanceAtoms = instance.atoms();
    const projectedAtoms: AlloyAtom[] = [];
    projections.forEach((projection) => {
      const atomId = projection.atom;
      if (atomId) {
        const atom = instanceAtoms.find((atom) => atom.id() === atomId);
        if (atom) projectedAtoms.push(atom);
      }
    });
    const projected = instance.project(projectedAtoms);

    // generate variables from the projected instance
    const sigs: ScriptVariable[] = projected.signatures().map((sig) => ({
      name: Reflect.get(sig, '__var__'),
      variable: sig,
      type: 'AlloySignature',
      typeUrl: SIG_URL
    }));
    const atoms: ScriptVariable[] = projected
      .atoms()
      .filter((atom) => isNaN(+atom.id()))
      .map((atom) => ({
        name: Reflect.get(atom, '__var__'),
        variable: atom,
        type: 'AlloyAtom',
        typeUrl: ATOM_URL
      }));
    const fields: ScriptVariable[] = projected.fields().map((field) => ({
      name: Reflect.get(field, '__var__'),
      variable: field,
      type: 'AlloyField',
      typeUrl: FIELD_URL
    }));
    const skolems: ScriptVariable[] = projected.skolems().map((skolem) => ({
      name: Reflect.get(skolem, '__var__'),
      variable: skolem,
      type: 'AlloySkolem',
      typeUrl: SKOLEM_URL
    }));
    const visStates: ScriptVariable[] = scriptViewImports.map((visState) => ({
      name: visState.name,
      variable: visState.value,
      type: `D3Helper`,
      typeUrl: D3_HELPER_URL,
    }));

    const scriptVariables: ScriptVariable[] = [
      {
        name: 'instance',
        variable: instance,
        type: 'AlloyInstance',
        typeUrl: INSTANCE_URL
      },
      ...sigs,
      ...atoms,
      ...fields,
      ...skolems,
      ...visStates
    ];

    if (isAlloyDatumTrace(datum.parsed)) {
      scriptVariables.unshift(
        {
          name: 'currentInstance',
          type: 'number',
          variable: time
        },
        {
          name: 'loopBack',
          type: 'number',
          variable: datum.parsed.loopBack
        },
        {
          name: 'instances',
          variable: instances,
          type: 'AlloyInstance[]',
          typeUrl: INSTANCE_URL
        }
      );
    }

    return scriptVariables;
  } else if (isDatumRaw(datum)) {
    return [
      {
        name: 'data',
        variable: datum.data,
        type: 'string'
      }
    ];
  }
  return [];
}

export default {
  selectScriptStage,
  selectScriptStageDimensions,
  selectScriptText,
  selectScriptVariables
};
