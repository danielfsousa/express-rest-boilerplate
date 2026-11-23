import { spawn } from 'node:child_process';

const port = process.env.PORT ?? '6006';
const extraArgs = process.argv.slice(2);

const child = spawn('storybook', ['dev', '--no-open', '-p', port, ...extraArgs], {
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
