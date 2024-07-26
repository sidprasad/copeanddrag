
import { readFileSync } from 'fs';
import {join }  from 'path';

const basepath = join(__dirname, 'penrose-templates');

const domainpath = join(basepath, 'default.domain');
export const DOMAIN_TEMPLATE = readFileSync(domainpath, { encoding: 'utf8' });

const substancepath = join(basepath, 'default.substance');
export const SUBSTANCE_TEMPLATE = readFileSync(substancepath, { encoding: 'utf8' });

const stylepath = join(basepath, 'default.style');
export const STYLE_TEMPLATE = readFileSync(stylepath, { encoding: 'utf8' });