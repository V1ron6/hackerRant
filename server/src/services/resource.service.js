const { Resource } = require('../models');

const SEED = [
  ['MDN Web Docs',          'https://developer.mozilla.org/',        'Docs and references for the web platform', 'Docs'],
  ['React Docs',            'https://react.dev/',                    'UI library documentation',                 'Docs'],
  ['DevDocs',               'https://devdocs.io/',                   'Fast, offline-friendly API docs in one place', 'Docs'],
  ['OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/', 'Concise application-security how-tos',     'Security'],
  ['TryHackMe',             'https://tryhackme.com/',                'Guided hands-on security rooms',           'Security'],
  ['GTFOBins',              'https://gtfobins.github.io/',           'Unix binaries abused for privilege escalation', 'Security'],
  ['roadmap.sh',            'https://roadmap.sh/',                   'Learning roadmaps for developer roles',    'Tutorials'],
  ['freeCodeCamp',          'https://www.freecodecamp.org/',         'Free coding courses and certifications',   'Tutorials'],
  ['The Odin Project',      'https://www.theodinproject.com/',       'Free full-stack curriculum',               'Tutorials'],
  ['Cheatography',          'https://cheatography.com/',             'Community cheat sheets',                   'Cheat sheets'],
];

exports.seedIfEmpty = async () => {
  if (await Resource.count()) return;
  await Resource.bulkCreate(SEED.map(([title, url, description, category]) => ({ title, url, description, category })));
  console.log('Seeded default Ranres resources');
};

exports.list = () => Resource.findAll({ order: [['category', 'ASC'], ['title', 'ASC']] });

exports.isAdmin = (user) =>
  String(process.env.ADMIN_USERNAMES || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
    .includes(user.username);

exports.create = (data) => Resource.create(data);
