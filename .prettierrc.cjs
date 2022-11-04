module.exports = {
  ...require('@danielfsousa/prettier-config'),
  importOrder: ['^@(.*)$', '^#(.*)$', '^[./]'],
  importOrderBuiltinModulesToTop: true,
}
