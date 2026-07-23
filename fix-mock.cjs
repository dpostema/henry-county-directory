
const fs = require('fs');
const glob = require('glob');
const uuids = {
  'id: "m1"': 'id: "11111111-1111-1111-1111-111111111111"',
  'id: "m2"': 'id: "22222222-2222-2222-2222-222222222222"',
  'id: "m3"': 'id: "33333333-3333-3333-3333-333333333333"',
  'id: "m4"': 'id: "44444444-4444-4444-4444-444444444444"'
};
glob.sync('src/**/*.tsx').forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;
  Object.keys(uuids).forEach(key => {
    if (content.includes(key)) {
      content = content.replaceAll(key, uuids[key]);
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});

