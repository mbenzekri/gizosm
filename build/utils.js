"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = exports.StatItems = exports.outputItem = exports.errorexit = void 0;
const turf = __importStar(require("@turf/turf"));
const config_1 = require("./config");
Array.prototype.first = function () { return this.length ? this[0] : undefined; };
Array.prototype.last = function () { return this.length ? this[this.length - 1] : undefined; };
Array.prototype.closed = function () { return this.first() === this.last(); };
Array.prototype.unique = function () { return this.length === 1; };
Array.prototype.empty = function () { return this.length === 0; };
function errorexit(assert, message, err) {
    if (!assert) {
        console.error(`ERROR ${process.argv[1]} : ${message}`);
        if (err) {
            console.log(` => \n ${err.message}`);
        }
        process.exit(-1);
    }
}
exports.errorexit = errorexit;
const TAGSCOUNT = {};
const SEP = {};
function coords2Point(elem, filter) {
    const c = elem.coords;
    const p = config_1.config.types[filter.type] ? config_1.config.types[filter.type](elem, filter) : elem.tags;
    switch (true) {
        case c.empty(): return null;
        case c.unique(): return turf.point(c[0], p);
        case c.closed(): return center(c, p);
        default: return middle(c, p);
    }
}
function coords2Line(elem, filter) {
    const p = config_1.config.types[filter.type] ? config_1.config.types[filter.type](elem, filter) : elem.tags;
    switch (true) {
        case elem.coords.empty(): return null;
        case elem.coords.unique(): return turf.lineString([elem.coords[0], elem.coords[0]], p);
        default: return turf.lineString(elem.coords, p);
    }
}
// center of linestring
function center(coords, properties) {
    const ls = turf.lineString(coords);
    const f = turf.center(ls);
    f.properties = properties;
    return f;
}
// middle of linestring
function middle(coords, properties) {
    const ls = turf.lineString(coords);
    const len = turf.length(ls) / 2;
    const f = turf.along(ls, len);
    f.properties = properties;
    return f;
}
function outputItem(filter, file, elem) {
    Object.keys(elem.tags).forEach((tag) => TAGSCOUNT[tag] = TAGSCOUNT[tag] ? TAGSCOUNT[tag] + 1 : 1);
    return new Promise((resolve, reject) => {
        const sep = SEP[file.rs.path] ? ',' : ' ';
        SEP[file.rs.path] = ',';
        const feature = (filter.gtype === 'Point') ? coords2Point(elem, filter) : coords2Line(elem, filter);
        file.rs.write(`${sep}${JSON.stringify(feature)}\n`, (error) => {
            if (error) {
                errorexit(!error, `unable to write to file ${file.rs.path}`, error);
            }
            file.count++;
            resolve();
        });
    });
}
exports.outputItem = outputItem;
function StatItems() {
    Object.keys(TAGSCOUNT).forEach((key) => console.log(`${key.padEnd(30)}\t${TAGSCOUNT[key]}`));
}
exports.StatItems = StatItems;
function formatBytes(size) {
    const def = [
        [1, 'octets'],
        [1024, 'ko'],
        [1024 * 1024, 'Mo'],
        [1024 * 1024 * 1024 * 1024 * 1024 * 1024, 'To'],
    ];
    for (let i = 0; i < def.length; i++) {
        if (size < def[i][0]) {
            return `${(size / def[i - 1][0]).toFixed(2)} ${def[i - 1][1]}`;
        }
    }
}
exports.formatBytes = formatBytes;
//# sourceMappingURL=utils.js.map