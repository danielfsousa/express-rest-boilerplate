module.exports = {
  ...require('@danielfsousa/prettier-config'),
  importOrder: ['^@(.*)$', '^#(.*)$', '^[./]'],
}
