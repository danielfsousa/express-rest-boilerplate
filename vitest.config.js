import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parse } from 'dotenv'
import { defineConfig } from 'vite'

function absolute(path) {
  return resolve(__dirname, path)
}

export default defineConfig({
  test: {
    restoreMocks: true,
    hookTimeout: 60000,
    env: parse(readFileSync(absolute('.env.test'), 'utf8')),
    alias: [
      { find: '#config', replacement: absolute('./src/config.js') },
      { find: /#controllers\/(.+)/, replacement: absolute('./src/controllers/$1.controller.js') },
      { find: /#enums\/(.+)/, replacement: absolute('./src/enums/$1.enum.js') },
      { find: /#errors\/(.+)/, replacement: absolute('./src/errors/$1.error.js') },
      { find: /#lib\/(.+)/, replacement: absolute('./src/lib/$1.js') },
      { find: /#middlewares\/(.+)/, replacement: absolute('./src/middlewares/$1.middleware.js') },
      { find: /#models\/(.+)/, replacement: absolute('./src/models/$1.model.js') },
      { find: /#routes\/(.+)/, replacement: absolute('./src/routes/$1.route.js') },
      { find: /#services\/(.+)/, replacement: absolute('./src/services/$1.service.js') },
      { find: /#validations\/(.+)/, replacement: absolute('./src/validations/$1.validation.js') },
    ],
  },
})
