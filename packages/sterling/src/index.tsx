import '@fontsource/fira-code/variable.css';
import '@fontsource/fira-code/400.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource/atkinson-hyperlegible/700-italic.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ChakraProvider } from '@chakra-ui/react';
import { sterlingTheme } from '@/sterling-ui';
import { Sterling } from './components/Sterling';
import store from './state/store';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={sterlingTheme}>
      <Provider store={store}>
        <Sterling url={getProviderURL()} />
      </Provider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

function getProviderURL(): string | undefined {
  const url = process.env.WS;
  if (url === 'query') return undefined;
  return url;
}
