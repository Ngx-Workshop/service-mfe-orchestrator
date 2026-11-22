import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = resolve(import.meta.dirname, '..');
const root = mkdtempSync(join(tmpdir(), 'orchestrator-maintenance-'));
const environment = { ...process.env, HUSKY: '0', CI: '' };

function run(cwd, command, args, env = environment, expected = 0) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 180_000,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    expected,
    `${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`
  );
  return result.stdout.trim();
}

function fixture(name, files = []) {
  const cwd = join(root, name);
  mkdirSync(cwd);
  for (const file of ['package.json', 'package-lock.json', ...files]) {
    mkdirSync(dirname(join(cwd, file)), { recursive: true });
    copyFileSync(join(source, file), join(cwd, file));
  }
  return cwd;
}

function write(cwd, file, content) {
  mkdirSync(dirname(join(cwd, file)), { recursive: true });
  writeFileSync(join(cwd, file), content);
}

try {
  const developer = fixture('developer', [
    '.husky/pre-commit',
    '.prettierignore',
    '.prettierrc',
    'lint-staged.config.mjs',
    'eslint.config.mjs',
    'scripts/verify-maintenance.mjs',
    '.github/workflows/checks.yml',
  ]);
  run(developer, 'git', ['init', '-q']);
  run(developer, 'git', ['config', 'user.name', 'Hook Fixture']);
  run(developer, 'git', [
    'config',
    'user.email',
    'hook-fixture@example.invalid',
  ]);
  const local = {
    ...environment,
    HUSKY: '1',
    NODE_ENV: '',
    npm_config_omit: '',
  };
  run(developer, 'npm', ['ci', '--no-audit', '--no-fund'], local);
  assert.equal(
    run(developer, 'git', ['config', '--get', 'core.hooksPath']),
    '.husky/_'
  );
  write(developer, '.gitignore', 'node_modules/\n.husky/_/\n');
  const baseline = "export const value = 1;\nexport const note = 'base';\n";
  write(developer, 'src/value.ts', baseline);
  write(developer, 'src/other.ts', 'export const other = 1;\n');
  write(developer, 'test/fixture.spec.ts', "test('fixture', () => {});\n");
  run(developer, 'git', ['add', '.']);
  const trailer =
    '\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>';
  run(developer, 'git', ['commit', '-qm', `baseline${trailer}`]);
  run(developer, 'npm', ['run', 'format:check']);

  write(
    developer,
    'src/value.ts',
    "export const value=2\nexport const note = 'base';\n"
  );
  run(developer, 'git', ['add', 'src/value.ts']);
  write(
    developer,
    'src/value.ts',
    "export const value=2\nexport const note = 'unstaged-canary';\n"
  );
  const other = 'export const other = 1;\n// unstaged-canary\n';
  write(developer, 'src/other.ts', other);
  run(developer, 'git', ['commit', '-qm', `partial staging${trailer}`], local);
  assert.equal(
    run(developer, 'git', ['show', 'HEAD:src/value.ts']),
    "export const value = 2;\nexport const note = 'base';"
  );
  assert.equal(
    readFileSync(join(developer, 'src/value.ts'), 'utf8'),
    "export const value = 2;\nexport const note = 'unstaged-canary';\n"
  );
  assert.equal(readFileSync(join(developer, 'src/other.ts'), 'utf8'), other);

  const invalidFormat = 'export const negative=1\n';
  write(developer, 'src/negative.ts', invalidFormat);
  run(developer, 'npm', ['run', 'format:check'], environment, 1);
  assert.equal(
    readFileSync(join(developer, 'src/negative.ts'), 'utf8'),
    invalidFormat
  );
  rmSync(join(developer, 'src/negative.ts'));
  write(developer, 'contracts/generated.ts', 'export const = ;\n');
  const info = JSON.parse(
    run(developer, join(developer, 'node_modules/.bin/prettier'), [
      '--file-info',
      'contracts/generated.ts',
    ])
  );
  assert.equal(info.ignored, true);
  const before = run(developer, 'git', ['rev-parse', 'HEAD']);
  write(developer, 'src/broken.ts', 'export const = ;\n');
  run(developer, 'git', ['add', 'src/broken.ts']);
  run(developer, 'git', ['commit', '-qm', `must fail${trailer}`], local, 1);
  assert.equal(run(developer, 'git', ['rev-parse', 'HEAD']), before);
  assert.equal(readFileSync(join(developer, 'src/other.ts'), 'utf8'), other);
  console.log(
    'PASS: developer install, real hook, partial staging, failure blocking, non-mutating gate, generated ignore'
  );

  const ci = fixture('ci');
  run(ci, 'git', ['init', '-q']);
  run(ci, 'npm', ['ci', '--no-audit', '--no-fund'], { ...local, CI: 'true' });
  assert.equal(existsSync(join(ci, '.husky/_')), false);
  run(ci, 'git', ['config', '--get', 'core.hooksPath'], environment, 1);
  console.log('PASS: CI installation skips hooks');

  const docker = fixture('package-only');
  run(docker, 'npm', ['ci', '--no-audit', '--no-fund'], local);
  assert.equal(existsSync(join(docker, '.husky')), false);
  console.log('PASS: Docker-style package-only/no-Git installation');

  const production = fixture('production');
  run(production, 'git', ['init', '-q']);
  run(
    production,
    'npm',
    ['ci', '--omit=dev', '--no-audit', '--no-fund'],
    local
  );
  assert.equal(existsSync(join(production, 'node_modules/husky')), false);
  assert.equal(existsSync(join(production, '.husky')), false);
  run(production, 'node', ['-e', "require('@tmdjr/ngx-auth-client')"]);
  console.log('PASS: production installation without devDependencies');
} finally {
  rmSync(root, { recursive: true, force: true });
}
