const keywords = new Set([
  'all',
  'some',
  'no',
  'lone',
  'one',
  'set',
  'in',
  'not',
  'and',
  'or',
  'implies',
  'iff',
  'else',
  'let',
  'disj',
  'sum',
  'none',
  'univ',
  'iden',
  'Int',
  'pred',
  'fun',
  'fact',
  'assert',
  'sig',
  'extends',
  'abstract',
  'true',
  'false'
]);

/** Lightweight, read-only highlighting; preserve the provider's formula text. */
export function CounterfactualCode({
  text,
  block = false
}: {
  text: string;
  block?: boolean;
}) {
  const tokens =
    text.match(
      /\/\/[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|`?[A-Za-z_$][\w$']*|\d+|[^\w\s`]+|\s+|./g
    ) ?? [];
  const code = (
    <code>
      {tokens.map((token, i) => {
        const kind = /^(\/\/|--|\/\*)/.test(token)
          ? 'comment'
          : keywords.has(token)
          ? 'keyword'
          : token.startsWith('`')
          ? 'atom'
          : /^\d+$/.test(token)
          ? 'number'
          : undefined;
        return kind ? (
          <span className={`cf-code-${kind}`} key={i}>
            {token}
          </span>
        ) : (
          token
        );
      })}
    </code>
  );
  return block ? <pre className='cf-code-block'>{code}</pre> : code;
}
