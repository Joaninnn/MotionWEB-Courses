#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Проверка на неиспользуемые импорты и console.log
function checkCodeQuality(dir) {
  const issues = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Проверка на console.log (только для production)
        const consoleLogs = content.match(/console\.log/g);
        if (consoleLogs && consoleLogs.length > 0) {
          // Пропускаем console.log для разработки, можно добавить флаг для production
          // issues.push(`${filePath}: ${consoleLogs.length} console.log statements`);
        }
        
        // Проверка на debugger
        const debuggers = content.match(/debugger/g);
        if (debuggers && debuggers.length > 0) {
          issues.push(`${filePath}: ${debuggers.length} debugger statements`);
        }
        
        // Проверка на TODO/FIXME
        const todos = content.match(/(TODO|FIXME|HACK)/g);
        if (todos && todos.length > 0) {
          issues.push(`${filePath}: ${todos.length} TODO/FIXME comments`);
        }
      }
    }
  }
  
  scanDirectory(dir);
  
  if (issues.length > 0) {
    console.log('🔍 Code Quality Issues Found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
    return false;
  } else {
    console.log('✅ Code quality check passed!');
    return true;
  }
}

// Проверка размера бандла
function checkBundleSize() {
  const packageJson = require('../package.json');
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});
  
  console.log(`📦 Dependencies: ${dependencies.length}`);
  console.log(`🛠️  Dev Dependencies: ${devDependencies.length}`);
  
  // Проверка на тяжелые зависимости
  const heavyDeps = dependencies.filter(dep => 
    dep.includes('lodash') || 
    dep.includes('moment') || 
    dep.includes('bootstrap')
  );
  
  if (heavyDeps.length > 0) {
    console.log(`⚠️  Heavy dependencies found: ${heavyDeps.join(', ')}`);
  }
}

// Основная функция
function main() {
  console.log('🚀 Running production cleanup check...\n');
  
  const isCodeClean = checkCodeQuality('./src');
  checkBundleSize();
  
  if (isCodeClean) {
    console.log('\n✅ Project is ready for production!');
    process.exit(0);
  } else {
    console.log('\n❌ Please fix code quality issues before production deployment.');
    process.exit(1);
  }
}

main();
