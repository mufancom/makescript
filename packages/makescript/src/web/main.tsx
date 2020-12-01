import 'antd/dist/antd.css';

import React from 'react';
import ReactDOM from 'react-dom';

import './main.css';

import {ENTRANCES} from './@constants';
import {App} from './@views/app';

main().catch(console.error);

async function main(): Promise<void> {
  await ENTRANCES.ready;

  await ENTRANCES.authorizationService.check();

  ReactDOM.render(<App />, document.getElementById('app'));
}
