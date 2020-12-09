#!/usr/bin/env node

import * as Path from 'path';

import {CLI, Shim} from 'clime';

import {logger} from './@utils';

let cli = new CLI('makescript', Path.join(__dirname, '@commands'));

let shim = new Shim(cli);
shim.execute(process.argv).catch(logger.error);
