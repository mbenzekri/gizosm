import * as turf from '@turf/turf';
import fs, { WriteStream } from 'fs';
import { config } from './config';

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        first(): T;
        last(): T;
        closed(): boolean;
        empty(): boolean;
        unique(): boolean;
    }
}

Array.prototype.first = function (this) { return this.length ? this[0] : undefined; };
Array.prototype.last = function (this) { return this.length ? this[this.length - 1] : undefined; };
Array.prototype.closed = function (this) { return this.first() === this.last(); };
Array.prototype.unique = function (this) { return this.length === 1; };
Array.prototype.empty = function (this) { return this.length === 0; };

// tslint:disable-next-line:interface-over-type-literal
export type OSMItem = {
    name: string,
    attrs: { [key: string]: string },
    tags: { [key: string]: string },
    coords: number[][],
};

export type OSMItemFilter = (osmitem: OSMItem) => boolean | string;

// tslint:disable-next-line:interface-over-type-literal
export type OSMFilter = {
    key: string,
    type: string,
    gtype: string,
    filter: OSMItemFilter,
};

export function errorexit(assert: any, message: string, err?: { message: string } | null) {
    if (!assert) {
        console.error(`ERROR ${process.argv[1]} : ${message}`);
        if (err) { console.log(` => \n ${err.message}`); }
        process.exit(-1);
    }
}

const TAGSCOUNT: { [key: string]: number } = {};

const SEP: { [key: string]: string } = {};

function coords2Point(elem: OSMItem, filter: OSMFilter) {
    const c = elem.coords;
    const p = config.types[filter.type] ? config.types[filter.type](elem, filter) : elem.tags;
    switch (true) {
        case c.empty(): return null;
        case c.unique(): return turf.point(c[0], p);
        case c.closed(): return center(c, p);
        default: return middle(c, p);
    }
}

function coords2Line(elem: OSMItem, filter: OSMFilter) {
    const p = config.types[filter.type] ? config.types[filter.type](elem, filter) : elem.tags;
    switch (true) {
        case elem.coords.empty(): return null;
        case elem.coords.unique(): return turf.lineString([elem.coords[0], elem.coords[0]], p);
        default: return turf.lineString(elem.coords, p);
    }
}

// center of linestring
function center(coords: number[][], properties: { [key: string]: any }) {
    const ls = turf.lineString(coords);
    const f = turf.center(ls);
    f.properties = properties;
    return f;
}

// middle of linestring
function middle(coords: number[][], properties: { [key: string]: any }) {
    const ls = turf.lineString(coords);
    const len = turf.length(ls) / 2;
    const f = turf.along(ls, len);
    f.properties = properties;
    return f;
}

export function outputItem(filter: OSMFilter, file: { rs: WriteStream, count: number }, elem: OSMItem) {
    Object.keys(elem.tags).forEach((tag) => TAGSCOUNT[tag] = TAGSCOUNT[tag] ? TAGSCOUNT[tag] + 1 : 1);
    return new Promise((resolve, reject) => {
        const sep = SEP[file.rs.path as string] ? ',' : ' ';
        SEP[file.rs.path as string] = ',';
        const feature = (filter.gtype === 'Point') ? coords2Point(elem, filter) : coords2Line(elem, filter);
        file.rs.write(`${sep}${JSON.stringify(feature)}\n`,
            (error) => {
                if (error) { errorexit(!error, `unable to write to file ${file.rs.path}`, error); }
                file.count++;
                resolve();
            });
    });
}

export function StatItems() {
    Object.keys(TAGSCOUNT).forEach((key) => console.log(`${key.padEnd(30)}\t${TAGSCOUNT[key]}`));
}

export function formatBytes(size: number) {
    const def: Array<[number, string]> = [
        [1, 'octets'],
        [1024, 'ko'],
        [1024 * 1024, 'Mo'],
        [1024 * 1024 * 1024 * 1024 * 1024 * 1024, 'To'],
    ];
    for (let i = 0; i < def.length; i++) {
        if (size < def[i][0]) { return `${(size / def[i - 1][0]).toFixed(2)} ${def[i - 1][1]}`; }
    }
}