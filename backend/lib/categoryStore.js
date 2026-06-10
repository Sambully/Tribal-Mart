// File-backed category list. Survives nodemon restarts so admin-added
// categories actually show up in the agency/agent Add Product dropdown.
//
// In production we'd swap this for a Mongoose `Setting` model; a flat
// JSON file is fine for the demo and adds zero new schemas.

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'categories.json');
const DEFAULTS = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Appliances',
  'Toys',
  'Vehicles',
  'Handmade',
  'Containers & Storage',
  'Home Decor',
  'Jewellery',
  'Textiles',
  'Others',
];

let cache = null;

function ensureDir() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
}

function load() {
  if (cache) return cache;
  try {
    if (fs.existsSync(FILE)) {
      const raw = fs.readFileSync(FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cache = parsed;
        return cache;
      }
    }
  } catch (e) {
    console.error('[categoryStore] failed to load, using defaults:', e.message);
  }
  cache = [...DEFAULTS];
  save();
  return cache;
}

function save() {
  try {
    ensureDir();
    fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('[categoryStore] failed to save:', e.message);
  }
}

exports.list = () => load();

exports.add = (name) => {
  const n = String(name || '').trim();
  if (!n) return { error: 'Name required' };
  const list = load();
  if (list.some((c) => c.toLowerCase() === n.toLowerCase())) {
    return { error: 'Category already exists' };
  }
  list.push(n);
  save();
  return { list };
};

exports.remove = (name) => {
  const list = load();
  cache = list.filter((c) => c !== name);
  save();
  return cache;
};
