"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unique = (osmitem) => Object.keys(osmitem).length === 1;
const whatever = () => true;
function adronly(osmitem) {
    return Object.keys(osmitem).every((key) => !key.startsWith('addr:'));
}
exports.config = {
    name: "STD",
    tags: {
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
        },
        ignored: {
            converted_by: true,
            created_by: true,
            source: true,
        },
    },
    filters: [
        { key: "amenity", type: 'poi', filter: whatever },
        { key: "shop", type: 'poi', filter: whatever },
        { key: "highway", type: 'transport', filter: whatever },
        { key: "railway", type: 'transport', filter: whatever },
        { key: "public_transport", type: 'transport', filter: whatever },
        { key: "traffic", type: 'transport', filter: whatever },
        { key: "traffic_calming", type: 'transport', filter: whatever },
        { key: "traffic_sign", type: 'transport', filter: whatever },
        { key: "barrier", type: 'transport', filter: whatever },
        { key: "noexit", type: 'transport', filter: whatever },
        { key: "waterway", type: 'transport', filter: whatever },
        { key: "seamark", type: 'transport', filter: whatever },
        { key: "airway", type: 'transport', filter: whatever },
        { key: "aeroway", type: 'transport', filter: whatever },
        { key: "aeroway", type: 'transport', filter: whatever },
        { key: "airmark", type: 'transport', filter: whatever },
        { key: "aerialway", type: 'transport', filter: whatever },
        { key: "ford", type: 'transport', filter: whatever },
        { key: "entrance", type: 'transport', filter: whatever },
        { key: "addr:housenumber", type: 'trash', filter: adronly },
        { key: "addr:street", type: 'trash', filter: adronly },
        { key: "addr:country", type: 'trash', filter: adronly },
        { key: "addr:postcode", type: 'trash', filter: adronly },
        { key: "addr:housenumber", type: 'trash', filter: adronly },
        { key: "place", type: 'location', filter: whatever },
        { key: "natural", type: 'location', filter: whatever },
        { key: "housename", type: 'location', filter: whatever },
        { key: "office", type: 'location', filter: whatever },
        { key: "man_made", type: 'location', filter: whatever },
        { key: "historic", type: 'location', filter: whatever },
        { key: "tourism", type: 'location', filter: whatever },
        { key: "leisure", type: 'location', filter: whatever },
        { key: "power", type: 'location', filter: whatever },
        { key: "emergency", type: 'health', filter: whatever },
    ],
};
//# sourceMappingURL=config.js.map