import { FIXTURES, generatorNameFor, getActiveFixture } from './fixtures';

/**
 * Provider metadata. We advertise each fixture in the registry as a
 * "generator", which surfaces in the Explorer tab as a runnable command.
 * Picking a generator and clicking Run sends a `click` message, which
 * `mockClick` below answers with the matching fixture's XML.
 */
export function mockMeta() {
  return {
    type: 'meta',
    version: 1,
    payload: {
      name: 'Mock',
      evaluator: 'mock',
      views: ['graph', 'table', 'script', 'edit'],
      generators: Object.keys(FIXTURES)
    }
  };
}

/**
 * Initial data response. When a `?fixture=<key>` query param is present, the
 * mock auto-serves that fixture immediately so page-load → graph is one step.
 * Otherwise the response is empty and the user selects a fixture from the
 * Explorer generator list, then clicks Run.
 */
export function mockData() {
  const hasExplicitFixture =
    typeof window !== 'undefined' &&
    window.location?.search &&
    new URLSearchParams(window.location.search).has('fixture');

  if (!hasExplicitFixture) {
    return { type: 'data', version: 1, payload: { enter: [] } };
  }

  const { key, fixture } = getActiveFixture();
  return datumFor(generatorNameFor(key), fixture.xml);
}

export function mockClick(payload: {
  id?: string;
  onClick: string;
  context?: { generatorName?: string };
}) {
  const requested = payload?.context?.generatorName;
  if (!requested || !(requested in FIXTURES)) {
    return { type: 'data', version: 1, payload: { enter: [] } };
  }
  return datumFor(generatorNameFor(requested), FIXTURES[requested].xml);
}

export function mockEval(req: { id: string; expression: string }) {
  return {
    type: 'eval',
    version: 1,
    payload: {
      id: req.id,
      result: `(mock) ${req.expression}`
    }
  };
}

function datumFor(generatorName: string, xml: string) {
  return {
    type: 'data',
    version: 1,
    payload: {
      enter: [
        {
          id: `mock-${generatorName}-${Date.now()}`,
          generatorName,
          format: 'alloy',
          data: xml,
          evaluator: false
        }
      ]
    }
  };
}
