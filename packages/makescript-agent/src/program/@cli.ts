#!/usr/bin/env node

import * as Path from 'path';

import {CLI, Shim} from 'clime';

import {logger} from './shared';

let cli = new CLI('makescript-agent', Path.join(__dirname, '@commands'));

let shim = new Shim(cli);
shim.execute(process.argv).catch(logger.error);
