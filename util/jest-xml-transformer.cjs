// Mirrors webpack's `asset/source` for `.xml` imports under jest, so
// `import rcXml from '...rc-datum.xml'` returns the file contents as a string.
module.exports = {
  process(src) {
    return { code: 'module.exports = ' + JSON.stringify(src) + ';' };
  }
};
