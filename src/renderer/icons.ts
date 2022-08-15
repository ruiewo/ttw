const defaultIcons = [
    'android',
    'aztec',
    'beard',
    'bird',
    'bird2',
    'butterfly',
    'cat',
    'cat2',
    'cherry',
    'crown',
    'dragon',
    'eagle',
    'ekg',
    'fleur-de-lis',
    'fleur-de-lis2',
    'incafish',
    'kamon1',
    'lion-heraldry',
    'man',
    'man2',
    'men',
    'mui',
    'mustache',
    'peacock',
    'pollution',
    'profile',
    'scorpion',
    'seahorse',
    'smoking',
    'spider',
    'symbol',
    'tree',
    'unicorn',
    'unicorn2',
    'wolf',
];

const programIcons = ['c++', 'csharp', 'java', 'nodejs', 'python'];

const warningIcon = 'warning';

function getRandomIcon() {
    if (Math.floor(Math.random() * 2) >= 1) {
        return defaultIcons[Math.floor(Math.random() * defaultIcons.length)];
    }
    return programIcons[Math.floor(Math.random() * programIcons.length)];
}

export const icons = {
    default: defaultIcons,
    pg: programIcons,
    warning: warningIcon,
    get random() {
        return getRandomIcon();
    },
};
