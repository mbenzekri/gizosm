// tslint:disable:object-literal-sort-keys
// tslint:disable: object-literal-key-quotes
// tslint:disable:max-line-length
import { OSMFilter, OSMItem } from './utils';

const unique = (osmitem: OSMItem) => Object.keys(osmitem.tags).length === 1;
const whatever = () => true;
function adronly(osmitem: OSMItem): string | boolean {
    return Object.keys(osmitem.tags).every((key) => !key.startsWith('addr:'));
}
type PropFunc = (i: OSMItem, f: OSMFilter) => {[key: string]: any};

const AMENITY_HEALTH_LIST = [
    'baby_hatch',
    'clinic',
    'dentist',
    'doctors',
    'hospital',
    'nursing_home',
    'pharmacy',
    'social_facility',
    'veterinary',
    'police',
];
export const config = {
    name: "STD",
    types: {
        "poi" : (item: OSMItem, f: OSMFilter) => {
            const keys = ['addr:housenumber', 'addr:street', 'addr:city', 'addr:postcode', 'addr:country'];
            const adr = keys.map((k) => item.tags[k]).filter((v) => v).join(' ');
            switch (f.key) {
                case 'amenity': return {type: item.tags.amenity, adr, name: item.tags.name};
                case 'shop': return {type: item.tags.amenity, adr, name: item.tags.name};
                case 'emergency': return {type: item.tags.amenity, adr, name: item.tags.name};
            }
            return {};
        },
    } as {[key: string]: PropFunc},
    tags: {
        whitelist: {
            "ref" : true,
            "name" : true,
            "addr:city" : true,
            "addr:street" : true,
            "addr:country" : true,
            "addr:postcode" : true,
            "addr:housenumber" : true,
            "amenity" : true,
            "shop" : true,
            "highway" : true,
            "route" : true,
            "railway" : true,
            "public_transport" : true,
            "traffic" : true,
            "traffic_calming" : true,
            "traffic_sign" : true,
            "barrier" : true,
            "noexit" : true,
            "waterway" : true,
            "seamark" : true,
            "airway" : true,
            "aeroway" : true,
            "airmark" : true,
            "aerialway" : true,
            "ford" : true,
            "entrance" : true,
            "place" : true,
            "housename" : true,
            "office" : true,
            "man_made" : true,
            "historic" : true,
            "tourism" : true,
            "leisure" : true,
            "power" : true,
            "natural" : true,
            "landuse" : true,
            "emergency" : true,
        } as { [key: string]: boolean },
        removed: {
            "advertising": true,
            "office": true,
            "fixme": true,
            "FIXME": true,
            "note": true,
            "comment": true,
            'seamark:name': true,
            'seamark:type': true,
            'seamark:information': true,
            'seamark:light': true,
        } as { [key: string]: boolean },
        ignored: {
            converted_by: true,
            created_by: true,
            source: true,
        } as { [key: string]: boolean },
        transfert: {
            emergency: "amenity",
            shop: "amenity",
        } as { [key: string]: string },
    },
    filters: [
        { key: "amenity", type: 'poi', gtype: 'Point', filter: whatever},
        { key: "shop", type: 'poi', gtype: 'Point', filter: whatever},
        { key: "emergency", type: 'poi', gtype: 'Point', filter: whatever },

        { key: "highway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "route", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "railway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "public_transport", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "traffic", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "traffic_calming", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "traffic_sign", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "barrier", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "noexit", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "waterway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "seamark", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "airway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "aeroway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "airmark", type: 'transport', gtype: 'Point', filter: whatever },
        { key: "aerialway", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "ford", type: 'transport', gtype: 'Line', filter: whatever },
        { key: "entrance", type: 'transport', gtype: 'Point', filter: whatever },

        { key: "place", type: 'location', gtype: 'same', filter: whatever },
        { key: "housename", type: 'location', gtype: 'same', filter: whatever },
        { key: "office", type: 'location', gtype: 'same', filter: whatever },
        { key: "man_made", type: 'location', gtype: 'same', filter: whatever },
        { key: "historic", type: 'location', gtype: 'same', filter: whatever },
        { key: "tourism", type: 'location', gtype: 'same', filter: whatever },
        { key: "leisure", type: 'location', gtype: 'same', filter: whatever },
        { key: "power", type: 'location', gtype: 'same', filter: whatever },

        { key: "natural", type: 'landuse', gtype: 'Polygon', filter: whatever },
        { key: "landuse", type: 'landuse', gtype: 'Polygon', filter: whatever },

        { key: "building", type: 'trash', gtype: 'same', filter: whatever },
        { key: "addr:housenumber", type: 'trash', gtype: 'same', filter: adronly },
        { key: "addr:street", type: 'trash', gtype: 'same', filter: adronly },
        { key: "addr:country", type: 'trash', gtype: 'same', filter: adronly },
        { key: "addr:postcode", type: 'trash', gtype: 'same', filter: adronly },
        { key: "addr:housenumber", type: 'trash', gtype: 'same', filter: adronly },

        ] as OSMFilter[],
};
