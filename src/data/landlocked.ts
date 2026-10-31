/**
 * THE 44 LANDLOCKED COUNTRIES (UN-recognised sovereign states with no sea coast).
 * Source: standard geographic definition; ISO 3166-1 alpha-2 + numeric.
 * Micro-states that have no polygon at world-atlas resolution carry explicit
 * lng/lat so a flag card can still land on them.
 */
export type Landlocked = {iso2: string; name: string; num: number; lng?: number; lat?: number};

export const LANDLOCKED: Landlocked[] = [
  {iso2: 'af', name: 'Afghanistan', num: 4},
  {iso2: 'ad', name: 'Andorra', num: 20, lng: 1.58, lat: 42.51},
  {iso2: 'am', name: 'Armenia', num: 51},
  {iso2: 'at', name: 'Austria', num: 40},
  {iso2: 'az', name: 'Azerbaijan', num: 31},
  {iso2: 'by', name: 'Belarus', num: 112},
  {iso2: 'bt', name: 'Bhutan', num: 64},
  {iso2: 'bo', name: 'Bolivia', num: 68},
  {iso2: 'bw', name: 'Botswana', num: 72},
  {iso2: 'bf', name: 'Burkina Faso', num: 854},
  {iso2: 'bi', name: 'Burundi', num: 108},
  {iso2: 'cf', name: 'Central African Rep.', num: 140},
  {iso2: 'td', name: 'Chad', num: 148},
  {iso2: 'cz', name: 'Czechia', num: 203},
  {iso2: 'sz', name: 'Eswatini', num: 748},
  {iso2: 'et', name: 'Ethiopia', num: 231},
  {iso2: 'hu', name: 'Hungary', num: 348},
  {iso2: 'kz', name: 'Kazakhstan', num: 398},
  {iso2: 'kg', name: 'Kyrgyzstan', num: 417},
  {iso2: 'la', name: 'Laos', num: 418},
  {iso2: 'ls', name: 'Lesotho', num: 426},
  {iso2: 'li', name: 'Liechtenstein', num: 438, lng: 9.55, lat: 47.16},
  {iso2: 'lu', name: 'Luxembourg', num: 442, lng: 6.13, lat: 49.61},
  {iso2: 'mw', name: 'Malawi', num: 454},
  {iso2: 'ml', name: 'Mali', num: 466},
  {iso2: 'md', name: 'Moldova', num: 498},
  {iso2: 'mn', name: 'Mongolia', num: 496},
  {iso2: 'np', name: 'Nepal', num: 524},
  {iso2: 'ne', name: 'Niger', num: 562},
  {iso2: 'mk', name: 'North Macedonia', num: 807},
  {iso2: 'py', name: 'Paraguay', num: 600},
  {iso2: 'rw', name: 'Rwanda', num: 646},
  {iso2: 'sm', name: 'San Marino', num: 674, lng: 12.45, lat: 43.94},
  {iso2: 'rs', name: 'Serbia', num: 688},
  {iso2: 'sk', name: 'Slovakia', num: 703},
  {iso2: 'ss', name: 'South Sudan', num: 728},
  {iso2: 'ch', name: 'Switzerland', num: 756},
  {iso2: 'tj', name: 'Tajikistan', num: 762},
  {iso2: 'tm', name: 'Turkmenistan', num: 795},
  {iso2: 'ug', name: 'Uganda', num: 800},
  {iso2: 'uz', name: 'Uzbekistan', num: 860},
  {iso2: 'va', name: 'Vatican City', num: 336, lng: 12.45, lat: 41.9},
  {iso2: 'zm', name: 'Zambia', num: 894},
  {iso2: 'zw', name: 'Zimbabwe', num: 716},
];

/** The two "doubly landlocked" states -- every neighbour is itself landlocked. */
export const DOUBLE_LOCKED = ['Uzbekistan', 'Liechtenstein'];
