#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

const rawArgs = process.argv.slice(2);
const cleanArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--host' || arg === '--hostname') {
    cleanArgs.push('-H', rawArgs[++i] || '0.0.0.0');
  } else if (arg.startsWith('--host=')) {
    cleanArgs.push('-H', arg.slice(7) || '0.0.0.0');
  } else if (arg.startsWith('--hostname=')) {
    cleanArgs.push('-H', arg.slice(11) || '0.0.0.0');
  } else if (arg === '-H') {
    cleanArgs.push('-H', rawArgs[++i] || '0.0.0.0');
  } else if (arg === '--port' || arg === '-p') {
    const requestedPort = rawArgs[++i] || '3000';
    const port = requestedPort === '8080' ? '3000' : requestedPort;
    cleanArgs.push('-p', port);
  } else if (arg.startsWith('--port=')) {
    const requestedPort = arg.slice(7) || '3000';
    const port = requestedPort === '8080' ? '3000' : requestedPort;
    cleanArgs.push('-p', port);
  } else {
    cleanArgs.push(arg);
  }
}

if (!cleanArgs.includes('-p')) {
  cleanArgs.push('-p', '3000');
}
if (!cleanArgs.includes('-H')) {
  cleanArgs.push('-H', '0.0.0.0');
}

const childEnv = {
  ...process.env,
  PORT: '3000',
};

const child = spawn(process.execPath, [nextBin, 'dev', ...cleanArgs], {
  stdio: 'inherit',
  env: childEnv,
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

