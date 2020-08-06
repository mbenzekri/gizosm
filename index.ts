// tslint:disable: max-line-length
import fs, { WriteStream } from 'fs';
import expat from 'node-expat';

import { config } from './config';
import { OSMItem } from './utils';

const osmfile = process.argv[2];
const outdir = process.argv[3];
console.log(process.argv.join(' - '));

function errorexit(assert: any, message: string, err?: { message: string } | null) {
    if (!assert) {
        console.error(`ERROR ${process.argv[1]} : ${message}`);
        if (err) { console.log(` => \n ${err.message}`); }
        process.exit(-1);
    }
}

errorexit(osmfile, 'no osm file provided');
errorexit(fs.existsSync(outdir), `argument 3 ${outdir} is not a directory or is unreachable`);

const files: { [key: string]: { rs: WriteStream, sep: ',' | ' ', count: number } } = {};

function openOutput(): Promise<void> {
    return new Promise((resolve, reject) => {
        let processed = 0;
        const toprocess = Object.keys(files).length;
        config.filters.forEach((fobj) => {
            if (fobj.type in files) { return; }
            const path = `${outdir}/${fobj.type}.geojson`;
            files[fobj.type] = { rs: fs.createWriteStream(path), sep: ' ', count: 0 };
            files[fobj.type].rs.write(`{"name":"OSM fobj.key","type":"FeatureCollection" ,"features":['\n`,
                (error) => {
                    errorexit(!error, `unable to open ${outdir}/${fobj.type}.geojson for writing`, error);
                    if (++processed >= toprocess) { resolve(); }
                });
        });

    });
}

// tslint:disable-next-line:interface-over-type-literal
function PointItem(file: { rs: WriteStream, sep: string, count: number }, elem: OSMItem) {
    Object.keys(elem.tags).forEach((tag) => TAGSCOUNT[tag] = TAGSCOUNT[tag] ? TAGSCOUNT[tag] + 1 : 1);
    return new Promise((resolve, reject) => {
        file.rs.write(
            // tslint:disable-next-line:max-line-length
            `${file.sep}{ "type":"Feature","geometry":{"type":"Point","coordinates":[${elem.attrs.lon},${elem.attrs.lat}]},"properties":${JSON.stringify(elem.tags)} }\n`,
            (error) => {
                file.sep = ',';
                file.count++;
                errorexit(!error, `unable to write to file ${file.rs.path}`, error);
                resolve();
            });
    });
}

const parser = new expat.Parser('UTF-8');
const TAGSCOUNT: { [key: string]: number } = {};
const nodeMap = new Map<string, [number, number]>();
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
            Object.keys(TAGSCOUNT).forEach((key) => console.log(`${key.padEnd(30)}\t${TAGSCOUNT[key]}`));
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
    console.log(`${lcount}: ${percent}%  processed at ${rate} bytes/sec ${bytes}/${ccount} estimated end in ${left}/s`);
    prevcount = bytes;
    prevdate = Date.now();
}, 2000);

function parseOSM() {

    let current: OSMItem;
    parser.on('startElement', (name: string, attrs: { [key: string]: string }) => {
        // console.log(name, attrs);
        if (name === 'node' && attrs.id && attrs.lat && attrs.lon) {
            nodeMap.set(attrs.id, [parseFloat(attrs.lon), parseFloat(attrs.lat)]);
            current = { name, attrs, tags: {} };
        }
        if (name === 'tag' && !config.tags.ignored[attrs.k]) {
            current.tags[attrs.k] = attrs.v;
        }
    });

    parser.on('endElement', (name) => {
        if (name === 'node' // only node (today) produce points
            && Object.keys(current.tags).length // not empty
            && !Object.keys(config.tags.removed).some((key) => !!current.tags[key]) // not in remove list
        ) {
            let written = false;
            for (const fobj of config.filters) {
                const ltype = current.tags[fobj.key] && fobj.filter(current);
                if (ltype) {
                    const type = typeof ltype === 'string' ? ltype : fobj.type;
                    PointItem(files[type], current);
                    written = true;
                    break;
                }
            }
            if (!written) {
                PointItem(files.trash, current);
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
