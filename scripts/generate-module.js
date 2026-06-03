const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Validar argumentos de entrada
const moduleName = process.argv[2];
if (!moduleName) {
  console.error('Erro: Por favor, forneça o nome do módulo. Exemplo: node scripts/generate-module.js profile');
  process.exit(1);
}

// Limpar o nome e formatar
const formattedName = moduleName.toLowerCase().trim();
const libPath = path.join(__dirname, '..', 'libs', 'domain', formattedName);
const importPath = `@nexel/domain-${formattedName}`;

console.log(`=== Iniciando Scaffolding para o módulo: "${formattedName}" ===`);

// 2. Verificar idempotência (se a pasta já existe)
if (fs.existsSync(libPath)) {
  console.log(`[Aviso] O módulo em "${libPath}" já existe. Pulando etapa de criação física.`);
} else {
  try {
    // 3. Executar o gerador do Nx Nest Library de forma determinística
    console.log(`[Nx] Executando gerador @nx/nest:library...`);
    const nxCommand = `npx nx g @nx/nest:library --name=${formattedName} --directory=libs/domain/${formattedName} --importPath=${importPath} --unitTestRunner=jest --strict=true`;
    console.log(`> ${nxCommand}`);
    execSync(nxCommand, { stdio: 'inherit' });
    console.log(`[Nx] Biblioteca gerada com sucesso!`);
  } catch (error) {
    console.error('Erro ao executar o comando Nx:', error.message);
    process.exit(1);
  }
}

// 4. Criar estrutura interna recomendada de pastas (Services, Controllers, Repositories)
const srcLibPath = path.join(libPath, 'src', 'lib');
if (fs.existsSync(srcLibPath)) {
  const subDirs = ['services', 'controllers', 'repositories'];
  
  subDirs.forEach((subDir) => {
    const targetDir = path.join(srcLibPath, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`[Estrutura] Diretório criado: ${path.join('src', 'lib', subDir)}`);
      
      // Criar um arquivo .gitkeep para manter a pasta no Git caso esteja vazia
      fs.writeFileSync(path.join(targetDir, '.gitkeep'), '');
    }
  });

  // 5. Garantir arquivo de export index.ts limpo na biblioteca
  const indexTsPath = path.join(libPath, 'src', 'index.ts');
  if (fs.existsSync(indexTsPath)) {
    const currentExports = fs.readFileSync(indexTsPath, 'utf8');
    if (!currentExports.includes(`export * from './lib/services/`)) {
      const updatedExports = `${currentExports}\n// Exportações do módulo de domínio\n// export * from './lib/services/...';\n`;
      fs.writeFileSync(indexTsPath, updatedExports, 'utf8');
      console.log('[Estrutura] index.ts atualizado com placeholders de export.');
    }
  }
}

console.log(`=== Scaffolding concluído com sucesso para "@nexel/domain-${formattedName}"! ===`);
console.log(`Aliás de importação configurado: ${importPath}`);
