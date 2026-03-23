#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Verzamel alle CSS-bestanden
const cssFiles = [
  'src/app/about/about.css',
  'src/app/app.css',
  'src/app/attendance/attendance.css',
  'src/app/avatar/avatar.css',
  'src/app/components/chat/chat.css',
  'src/app/components/event-form/event-form.css',
  'src/app/components/gotcha-banner/gotcha-banner.css',
  'src/app/components/gotcha-end-screen/gotcha-end-screen.css',
  'src/app/components/gotcha-kill-feed/gotcha-kill-feed.css',
  'src/app/components/gotcha-rules/gotcha-rules.css',
  'src/app/components/report/report.css',
  'src/app/dashboard/dashboard.css',
  'src/app/dashboard/report-award/report-award.css',
  'src/app/dashboard/report-chat/report-chat.css',
  'src/app/dashboard/report-event/report-event.css',
  'src/app/event-detail/event-detail.css',
  'src/app/event/event.css',
  'src/app/gotcha-end-page/gotcha-end-page.css',
  'src/app/gotcha-history-page/gotcha-history-page.css',
  'src/app/gotcha-page/gotcha-page.css',
  'src/app/gotcha-settings/gotcha-settings.css',
  'src/app/home/home.css',
  'src/app/kudo-overview/kudo-overview.css',
  'src/app/leaderboard/leaderboard.css',
  'src/app/leaderboard-modal/leaderboard-modal.css',
  'src/app/minesweeper/minesweeper.css',
  'src/app/nerdle/nerdle.css',
  'src/app/noclass/no-class-modal.css',
  'src/app/profile/profile.css',
  'src/app/qrcode/qrcode.css',
  'src/app/sudoku/sudoku.css',
  'src/app/userlist/userlist.css',
  'src/styles.css'
];

const cssData = {};
const patterns = {
  colors: {},
  spacing: {},
  borderRadius: {},
  transitions: {},
  flexPatterns: {},
  gridPatterns: {},
  fontSizes: {},
  fontWeights: {},
  shadows: {},
  mediaQueries: {}
};

const duplicateRules = {};
const allRules = [];

// Lees alle CSS-bestanden
for (const file of cssFiles) {
  const filePath = path.join('/home/hugodor/WebstormProjects/quest100frontend', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    cssData[file] = content;
  }
}

// Parse CSS en extract patterns
function parseCSS(content, filename) {
  const lines = content.split('\n');
  let currentSelector = '';
  let inRule = false;
  const rules = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('@media') || line.includes('@keyframes') || line.includes('@import')) {
      patterns.mediaQueries[line] = (patterns.mediaQueries[line] || 0) + 1;
      continue;
    }

    if (line.endsWith('{')) {
      currentSelector = line.replace('{', '').trim();
      inRule = true;
    } else if (line === '}') {
      inRule = false;
    } else if (inRule && line.includes(':') && !line.startsWith('//')) {
      const rule = line.replace(/;$/, '').trim();
      rules.push(rule);
      allRules.push({ rule, file: filename, line: i });

      // Extract patterns
      extractPatterns(rule);

      // Track duplicates
      if (!duplicateRules[rule]) {
        duplicateRules[rule] = [];
      }
      duplicateRules[rule].push(filename);
    }
  }

  return rules;
}

function extractPatterns(rule) {
  // Kleuren (hex, rgb, oklch, etc.)
  const colorMatch = rule.match(/(#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\([^)]+\)|oklch\([^)]+\)|rgba?\([^)]+\))/gi);
  if (colorMatch) {
    colorMatch.forEach(color => {
      patterns.colors[color.toLowerCase()] = (patterns.colors[color.toLowerCase()] || 0) + 1;
    });
  }

  // Spacing (padding, margin, gap)
  const spacingMatch = rule.match(/(padding|margin|gap|width|height):\s*([^;]+)/gi);
  if (spacingMatch) {
    spacingMatch.forEach(match => {
      patterns.spacing[match.toLowerCase()] = (patterns.spacing[match.toLowerCase()] || 0) + 1;
    });
  }

  // Border-radius
  if (rule.includes('border-radius')) {
    const brMatch = rule.match(/border-radius:\s*([^;]+)/);
    if (brMatch) {
      patterns.borderRadius[brMatch[1].trim()] = (patterns.borderRadius[brMatch[1].trim()] || 0) + 1;
    }
  }

  // Transitions
  if (rule.includes('transition')) {
    const transMatch = rule.match(/transition:\s*([^;]+)/);
    if (transMatch) {
      patterns.transitions[transMatch[1].trim()] = (patterns.transitions[transMatch[1].trim()] || 0) + 1;
    }
  }

  // Flex patterns
  if (rule.includes('display: flex') || rule.includes('flex')) {
    patterns.flexPatterns[rule.toLowerCase()] = (patterns.flexPatterns[rule.toLowerCase()] || 0) + 1;
  }

  // Grid patterns
  if (rule.includes('display: grid') || rule.includes('grid')) {
    patterns.gridPatterns[rule.toLowerCase()] = (patterns.gridPatterns[rule.toLowerCase()] || 0) + 1;
  }

  // Font sizes
  if (rule.includes('font-size')) {
    const fsMatch = rule.match(/font-size:\s*([^;]+)/);
    if (fsMatch) {
      patterns.fontSizes[fsMatch[1].trim()] = (patterns.fontSizes[fsMatch[1].trim()] || 0) + 1;
    }
  }

  // Font weights
  if (rule.includes('font-weight')) {
    const fwMatch = rule.match(/font-weight:\s*([^;]+)/);
    if (fwMatch) {
      patterns.fontWeights[fwMatch[1].trim()] = (patterns.fontWeights[fwMatch[1].trim()] || 0) + 1;
    }
  }

  // Shadows
  if (rule.includes('box-shadow') || rule.includes('text-shadow')) {
    const shadowMatch = rule.match(/(box-shadow|text-shadow):\s*([^;]+)/);
    if (shadowMatch) {
      patterns.shadows[shadowMatch[1]] = (patterns.shadows[shadowMatch[1]] || 0) + 1;
    }
  }
}

// Analyze
console.log('\n========== CSS ANALYSE RESULTATEN ==========\n');

for (const [file, content] of Object.entries(cssData)) {
  parseCSS(content, file);
}

// Bereken statistieken
const totalLines = Object.values(cssData).reduce((sum, content) => sum + content.split('\n').length, 0);
const duplicateRulesList = Object.entries(duplicateRules)
  .filter(([_, files]) => files.length > 1)
  .sort((a, b) => b[1].length - a[1].length);

const duplicateLines = duplicateRulesList.reduce((sum, [_, files]) => sum + files.length, 0);
const duplicatePercentage = ((duplicateLines / totalLines) * 100).toFixed(2);

console.log(`📊 TOTALE STATISTIEKEN:`);
console.log(`   - CSS-bestanden: ${Object.keys(cssData).length}`);
console.log(`   - Totale regels: ${totalLines}`);
console.log(`   - Gedupliceerde regels: ${duplicateLines} (${duplicatePercentage}%)`);
console.log(`   - Unieke CSS-regels: ${Object.keys(duplicateRules).length}`);

console.log(`\n🎨 MEEST GEBRUIKTE KLEUREN (top 15):`);
Object.entries(patterns.colors)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([color, count], idx) => {
    console.log(`   ${idx + 1}. ${color}: ${count}x gebruikt`);
  });

console.log(`\n📐 MEEST GEBRUIKTE SPACING-PATRONEN (top 15):`);
Object.entries(patterns.spacing)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([spacing, count], idx) => {
    console.log(`   ${idx + 1}. ${spacing}: ${count}x`);
  });

console.log(`\n⭕ BORDER-RADIUS WAARDEN (top 10):`);
Object.entries(patterns.borderRadius)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([br, count], idx) => {
    console.log(`   ${idx + 1}. ${br}: ${count}x`);
  });

console.log(`\n⚡ MEEST GEBRUIKTE TRANSITIONS (top 10):`);
Object.entries(patterns.transitions)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([trans, count], idx) => {
    console.log(`   ${idx + 1}. ${trans}: ${count}x`);
  });

console.log(`\n✍️  FONT-SIZE WAARDEN:`);
Object.entries(patterns.fontSizes)
  .sort((a, b) => b[1] - a[1])
  .forEach(([size, count], idx) => {
    console.log(`   ${idx + 1}. ${size}: ${count}x`);
  });

console.log(`\n🔤 FONT-WEIGHT WAARDEN:`);
Object.entries(patterns.fontWeights)
  .sort((a, b) => b[1] - a[1])
  .forEach(([weight, count]) => {
    console.log(`   • ${weight}: ${count}x`);
  });

console.log(`\n🔷 BOX-SHADOW WAARDEN:`);
Object.entries(patterns.shadows)
  .sort((a, b) => b[1] - a[1])
  .forEach(([shadow, count], idx) => {
    console.log(`   ${idx + 1}. ${shadow}: ${count}x`);
  });

console.log(`\n📋 TOP 20 GEDUPLICEERDE REGELS (voorkomen in meerdere bestanden):`);
duplicateRulesList.slice(0, 20).forEach(([rule, files], idx) => {
  console.log(`   ${idx + 1}. [${files.length}x] ${rule}`);
  console.log(`      → In bestanden: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` (+${files.length - 3} meer)` : ''}`);
});

console.log(`\n📂 BESTANDSGROOTTE ANALYSE:`);
const fileSizes = Object.entries(cssData)
  .map(([file, content]) => ({
    file,
    lines: content.split('\n').length,
    bytes: content.length
  }))
  .sort((a, b) => b.lines - a.lines);

fileSizes.forEach(({ file, lines, bytes }) => {
  const duplicateInFile = Object.entries(duplicateRules)
    .filter(([_, files]) => files.includes(file) && files.length > 1)
    .length;
  console.log(`   ${file}: ${lines} regels (${bytes} bytes) - ${duplicateInFile} gedupliceerde regels`);
});

console.log(`\n🔧 GEDUPLICEERDE FLEX/GRID PATRONEN (top 5):`);
const allFlexGridRules = Object.entries(patterns.flexPatterns)
  .concat(Object.entries(patterns.gridPatterns))
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

if (allFlexGridRules.length > 0) {
  allFlexGridRules.forEach(([rule, count], idx) => {
    console.log(`   ${idx + 1}. [${count}x] ${rule.substring(0, 80)}${rule.length > 80 ? '...' : ''}`);
  });
} else {
  console.log('   (Geen flex/grid patronen gevonden)');
}

console.log(`\n🎯 IDENTIFICATIE SUMMARY:\n`);
console.log(`   ✓ Meest voorkomende kleuren: ${Object.keys(patterns.colors).length} unieke kleuren`);
console.log(`   ✓ Meest voorkomende spacing: ${Object.keys(patterns.spacing).length} unieke spacing-waarden`);
console.log(`   ✓ Meest voorkomende font-sizes: ${Object.keys(patterns.fontSizes).length} unieke font-sizes`);
console.log(`   ✓ Meest voorkomende transitions: ${Object.keys(patterns.transitions).length} unieke transitions`);
console.log(`   ✓ Gedupliceerde regels: ${duplicateRulesList.length} regels voorkomen meerdere keren`);
console.log(`   ✓ Potentiaal bespaard: ~${Math.round(duplicatePercentage)}% van CSS-volume\n`);

// Sla analyse op als JSON
const analysisResult = {
  timestamp: new Date().toISOString(),
  totalStats: {
    files: Object.keys(cssData).length,
    totalLines,
    duplicateLines,
    duplicatePercentage: parseFloat(duplicatePercentage),
    duplicateRulesCount: duplicateRulesList.length
  },
  patterns: {
    colorCount: Object.keys(patterns.colors).length,
    spacingCount: Object.keys(patterns.spacing).length,
    fontSizeCount: Object.keys(patterns.fontSizes).length,
    fontWeightCount: Object.keys(patterns.fontWeights).length,
    transitionCount: Object.keys(patterns.transitions).length,
    shadowCount: Object.keys(patterns.shadows).length,
    borderRadiusCount: Object.keys(patterns.borderRadius).length
  },
  topColors: Object.entries(patterns.colors).sort((a, b) => b[1] - a[1]).slice(0, 20),
  topSpacing: Object.entries(patterns.spacing).sort((a, b) => b[1] - a[1]).slice(0, 15),
  topTransitions: Object.entries(patterns.transitions).sort((a, b) => b[1] - a[1]).slice(0, 10),
  topDuplicatedRules: duplicateRulesList.slice(0, 30),
  fileSizes
};

fs.writeFileSync(
  '/home/hugodor/WebstormProjects/quest100frontend/css-analysis.json',
  JSON.stringify(analysisResult, null, 2)
);

console.log(`✅ Analyse opgeslagen naar css-analysis.json`);

