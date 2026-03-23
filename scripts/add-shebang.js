const fs = require('node:fs');
const path = require('node:path');

const _cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
const binPath = path.join(__dirname, '..', 'bin', 'api2mcp.js');

// 确保 bin 目录存在
const binDir = path.dirname(binPath);
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// 创建 bin 脚本
const binContent = `#!/usr/bin/env node
require('../dist/cli.js');
`;

fs.writeFileSync(binPath, binContent);

// 设置可执行权限
fs.chmodSync(binPath, 0o755);

console.log('Created bin/api2mcp.js with executable permissions');
