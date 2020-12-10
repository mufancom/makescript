#!/usr/bin/env node

import * as Path from 'path';

import {logger} from '@makeflow/makescript-agent';
import {CLI, Shim} from 'clime';

let cli = new CLI('makescript', Path.join(__dirname, '@commands'));

let shim = new Shim(cli);
shim.execute(process.argv).catch(logger.error);
