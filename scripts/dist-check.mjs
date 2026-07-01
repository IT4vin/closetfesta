import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const expectedDir = process.env.BUILD_OUT_DIR || 'dist';
const rootDir = process.cwd();
const outputDir = path.resolve(rootDir, expectedDir);
const legacyDirs = ['closetfesta', 'build'].filter((dir) => dir !== expectedDir);

const print = (message = '') => console.log(message);
const printError = (message = '') => console.error(message);

function listDir(target, indent = '  ') {
  if (!existsSync(target)) {
    print(`${indent}- não existe: ${path.relative(rootDir, target) || target}`);
    return;
  }

  const entries = readdirSync(target, { withFileTypes: true }).slice(0, 30);
  if (!entries.length) {
    print(`${indent}- diretório vazio`);
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(target, entry.name);
    const type = entry.isDirectory() ? 'dir ' : 'file';
    const size = entry.isFile() ? ` ${statSync(entryPath).size}b` : '';
    print(`${indent}- ${type} ${entry.name}${size}`);
  }
}

function countFiles(target) {
  if (!existsSync(target)) return 0;
  let total = 0;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const entryPath = path.join(target, entry.name);
    total += entry.isDirectory() ? countFiles(entryPath) : 1;
  }
  return total;
}

function readPackageScripts() {
  try {
    const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    return pkg.scripts || {};
  } catch (error) {
    printError(`Não foi possível ler package.json: ${error.message}`);
    return {};
  }
}

const scripts = readPackageScripts();
const indexHtml = path.join(outputDir, 'index.html');
const fileCount = countFiles(outputDir);
const failures = [];

if (!existsSync(outputDir)) {
  failures.push(`Diretório esperado não foi criado: ${expectedDir}/`);
} else if (!statSync(outputDir).isDirectory()) {
  failures.push(`O caminho esperado existe, mas não é um diretório: ${expectedDir}`);
}

if (existsSync(outputDir) && fileCount === 0) {
  failures.push(`Diretório ${expectedDir}/ existe, mas está vazio.`);
}

if (!existsSync(indexHtml)) {
  failures.push(`Arquivo obrigatório ausente: ${expectedDir}/index.html`);
}

if (failures.length) {
  printError('\n❌ dist-check falhou');
  printError('Motivo(s):');
  for (const failure of failures) printError(`- ${failure}`);

  printError('\nDiagnóstico do build:');
  printError(`- Diretório atual: ${rootDir}`);
  printError(`- Saída esperada: ${expectedDir}/`);
  printError(`- Script atual: ${process.env.npm_lifecycle_event || 'desconhecido'}`);
  printError(`- build: ${scripts.build || 'não definido'}`);
  printError(`- build:dev: ${scripts['build:dev'] || 'não definido'}`);
  printError(`- dist-check: ${scripts['dist-check'] || 'não definido'}`);

  printError('\nConteúdo da raiz do projeto:');
  listDir(rootDir);

  printError(`\nConteúdo de ${expectedDir}/:`);
  listDir(outputDir);

  for (const legacyDir of legacyDirs) {
    const legacyPath = path.resolve(rootDir, legacyDir);
    if (existsSync(legacyPath)) {
      printError(`\n⚠️ Diretório alternativo encontrado (${legacyDir}/).`);
      printError(`Se ele tiver os arquivos do app, algum script/configuração ainda está apontando para ${legacyDir}/ em vez de ${expectedDir}/.`);
      listDir(legacyPath);
    }
  }

  printError('\nCorreção esperada: manter Vite outDir, build, build:dev e dist-check usando dist/.');
  process.exit(1);
}

print(`✅ dist-check OK: ${expectedDir}/ encontrado com index.html e ${fileCount} arquivo(s).`);