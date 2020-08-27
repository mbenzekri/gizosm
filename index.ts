// tslint:disable: max-line-length

import fs, { WriteStream } from 'fs';
import expat from 'node-expat';

import { config } from './config';
import { errorexit, OSMFilter, OSMItem, outputItem, StatItems, formatBytes } from './utils';

const osmfile = process.argv[2];
const outdir = process.argv[3];
console.log(process.argv.join(' - '));

errorexit(osmfile, 'no osm file provided');
errorexit(fs.existsSync(outdir), `argument 3 ${outdir} is not a directory or is unreachable`);

const files: { [key: string]: { rs: WriteStream, count: number } } = {};

function openOutput(): Promise<void> {
    return new Promise((resolve, reject) => {
        let processed = 0;
        const toprocess = Object.keys(files).length;
        config.filters.forEach((fobj) => {
            if (fobj.type in files) { return; }
            const path = `${outdir}/${fobj.type}.geojson`;
            files[fobj.type] = { rs: fs.createWriteStream(path), count: 0 };
            files[fobj.type].rs.write(`{"name":"OSM-${fobj.type}","type":"FeatureCollection" ,"features":[\n`,
                (error) => {
                    errorexit(!error, `unable to open ${outdir}/${fobj.type}.geojson for writing`, error);
                    if (++processed >= toprocess) { resolve(); }
                });
        });

    });
}

const parser = new expat.Parser('UTF-8');
const nodeMap = new Map<string, number[]>();
let bytes = 0;
let ccount = 0;
let lcount = 0;
let ecount = 0;

function openInput() {

    let readStream: fs.ReadStream;
    try {
        const stat = fs.statSync(osmfile);
        ccount = stat.size;
        readStream = fs.createReadStream(osmfile, 'utf8');
        readStream.on('open', () => console.log(`Start reading ${osmfile}`));
        readStream.on('error', (err) => errorexit(err, `unable to read ${osmfile}`, err));
        readStream.on('data', (data: string) => {
            bytes += data.length;
            lcount += data.split(/\n/).length;
            const ok = parser.write(data);
            if (!ok && parser.getError()) {
                console.error(`ERROR: parse error ${osmfile} at line ${lcount} => message: ${parser.getError()}`);
                errorexit(++ecount < 10, `too much errors`);
            }
        });
        readStream.on('end', () => {
            console.log(`End reading ${osmfile}`);
            Object.keys(files).forEach((type) => {
                files[type].rs.write(`]}\n`, () => files[type].rs.close());
                console.log(`File ${type}: ${files[type].count} objs`);
            });
            StatItems();
            clearInterval(interval);
            // process.exit(0);
        });
    } catch (e) {
        errorexit(e, `unable to read ${osmfile}`, e);
    }
}

let prevcount = bytes;
let prevdate = Date.now();
const interval = setInterval(() => {
    const percent = Math.round(bytes * 100 / ccount);
    const rate = Math.floor((1000 * (bytes - prevcount)) / (Date.now() - prevdate));
    const left = Math.floor((ccount - bytes) / rate);
    console.log(`${lcount}: ${percent}%  processed at ${formatBytes(rate)}/sec ${bytes}/${ccount} estimated end in ${left}/s`);
    prevcount = bytes;
    prevdate = Date.now();
}, 2000);

function parseOSM() {

    let current: OSMItem;
    parser.on('startElement', (name: string, attrs: { [key: string]: string }) => {
        // console.log(name, attrs);
        if (name === 'node' && attrs.id && attrs.lat && attrs.lon) {
            const coord = [parseFloat(attrs.lon), parseFloat(attrs.lat)];
            nodeMap.set(attrs.id, coord);
            current = { name, attrs, tags: {}, coords: [coord] };
        }
        if (name === 'way' && attrs.id) {
            current = { name, attrs, tags: {}, coords: [] };
        }
        if (name === 'tag' && !config.tags.ignored[attrs.k]) {
            if (config.tags.whitelist[attrs.k]) {
                current.tags[attrs.k] = attrs.v;
            }
        }
        if (name === 'nd' && attrs.ref) {
            const point = nodeMap.get(attrs.ref);
            if (point) { current.coords.push(point); }
        }
    });

    parser.on('endElement', (name) => {
        if ((name === 'node' || name === 'way') // node produce points / way produce lines
            && Object.keys(current.tags).length // not empty
            && !Object.keys(config.tags.removed).some((key) => !!current.tags[key]) // not in remove list
        ) {
            let written = false;
            for (const fobj of config.filters) {
                const ltype = current.tags[fobj.key] && fobj.filter(current);
                if (ltype) {
                    const type = typeof ltype === 'string' ? ltype : fobj.type;
                    // transfert fields if needed
                    Object.keys(current.tags).forEach((key) => {
                        const target = config.tags.transfert[key];
                        if (target && !current.tags[target]) {
                            current.tags[target] = current.tags[key];
                        }
                    });
                    outputItem(fobj, files[type], current);
                    written = true;
                    break;
                }
            }
            if (!written) {
                const fobj: OSMFilter = {key : 'trash', type: 'trash', gtype: (name === 'node') ?  'Point' : 'Line', filter: (f) => true};
                outputItem(fobj, files.trash, current);
            }
        }
    });

    parser.on('text', (text) => {
        // console.log(text);
    });

    parser.on('error', (error) => {
        errorexit(error, `parse error at ${bytes}`, error);
    });
}

openOutput()
    .then(() => {
        openInput();
        parseOSM();
    }).catch((err) => console.error(err.toString()));
