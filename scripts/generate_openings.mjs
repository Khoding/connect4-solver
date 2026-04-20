import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_DEPTH = 5;
const COLS = 7;
const ROWS = 6;

const swWords = [
  'Skywalker',
  'Vader',
  'Jedi',
  'Sith',
  'Coruscant',
  'Tatooine',
  'Mandalorian',
  'Yoda',
  'Kenobi',
  'Palpatine',
  'Empire',
  'Rebel',
  'Wookiee',
  'Droid',
  'Hyperspace',
  'Falcon',
];
const dcWords = [
  'Gotham',
  'Metropolis',
  'Batman',
  'Superman',
  'Joker',
  'Flash',
  'Aquaman',
  'Wonder Woman',
  'Lex Luthor',
  'Krypton',
  'Darkseid',
  'Arkham',
  'Justice',
  'Riddler',
  'Atlantis',
  'Cyborg',
];
const terms = [
  'Gambit',
  'Defense',
  'Attack',
  'Trap',
  'Opening',
  'Variation',
  'System',
  'Maneuver',
  'Assault',
  'Counter',
  'Strike',
  'Advance',
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  const sw = getRandom(swWords);
  const dc = getRandom(dcWords);
  const term = getRandom(terms);

  const formats = [
    `The ${sw} ${term}`,
    `${dc}'s ${term}`,
    `${sw}-${dc} ${term}`,
    `The ${dc} ${sw} ${term}`,
    `${sw} vs ${dc} ${term}`,
    `${sw}'s ${dc} ${term}`,
  ];
  return getRandom(formats);
}

const openings = {};

function generateSequences(currentSeq, colCounts) {
  if (currentSeq.length > 0) {
    openings[currentSeq] = generateName();
  }

  if (currentSeq.length === MAX_DEPTH) {
    return;
  }

  for (let c = 1; c <= COLS; c++) {
    if (colCounts[c] < ROWS) {
      colCounts[c]++;
      generateSequences(currentSeq + c.toString(), colCounts);
      colCounts[c]--;
    }
  }
}

const initialCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};
generateSequences('', initialCounts);

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, {recursive: true});
}

fs.writeFileSync(path.join(publicDir, 'openings.json'), JSON.stringify(openings, null, 2));
console.log(`Generated ${Object.keys(openings).length} openings in public/openings.json`);
