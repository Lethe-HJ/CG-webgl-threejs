#!/usr/bin/env node

/**
 * 交互式生成 changelog（基于 git log）
 * 支持命令行参数或交互式输入
 * 使用方法: 
 *   - 交互式: node scripts/changelog.mjs
 *   - 命令行: node scripts/changelog.mjs <from-ref> [to-ref] [--author=<author>]
 * 起止可以是 commit id 或 tag
 * 示例: 
 *   - node scripts/changelog.mjs
 *   - node scripts/changelog.mjs abc1234
 *   - node scripts/changelog.mjs v1.0.0 v2.0.0
 *   - node scripts/changelog.mjs abc1234 def5678 --author=hujing
 *   - node scripts/changelog.mjs v1.0.0 --author=hujing
 */

import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

// 验证 ref（commit id 或 tag）是否存在，返回是否合法
function validateRef(ref) {
  if (!ref || typeof ref !== 'string') return false;
  try {
    execSync(`git rev-parse --verify "${ref}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 将 ref 解析为完整 commit hash
function resolveRef(ref) {
  return execSync(`git rev-parse --verify "${ref}"`, { encoding: 'utf-8' }).trim();
}

// 判断 ancestor 是否是 descendant 的祖先（或相等）
function isAncestorOf(ancestorRef, descendantRef) {
  try {
    execSync(`git merge-base --is-ancestor "${ancestorRef}" "${descendantRef}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 获取当前分支上最近的 tag（按提交历史）
function getLastTagOnBranch() {
  return execSync('git describe --tags --abbrev=0', { encoding: 'utf-8' }).trim();
}

// 获取当前分支名
function getBranchName() {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

// 获取当前分支上所有 tag，按时间由远到近排序（creatordate 升序）
function getTagsOnBranchSortedByDate() {
  const out = execSync('git tag --merged=HEAD --sort=creatordate', { encoding: 'utf-8' });
  return out.trim() ? out.trim().split('\n').map((t) => t.trim()).filter(Boolean) : [];
}

// 生成带毫秒的日期时间字符串：年-月-日 时:分:秒.毫秒
function getDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}.${ms}`;
}

// 生成用于文件名的时间戳
function getTimestampForFilename() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${y}${m}${d}-${h}${min}${s}-${ms}`;
}

// 从 package.json 读取 homepage
function getHomePage() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.homepage || '';
  } catch {
    return '';
  }
}

// 生成 CHANGELOG 文件顶部的元信息（Markdown）
function buildChangelogHeader(fromRefName, fromCommitId, toRefName, toCommitId, branchName) {
  const dateStr = getDateString();
  const shortFromCommitId = fromCommitId.slice(0, 7);
  const shortToCommitId = toCommitId.slice(0, 7);
  const fromDisplay = fromRefName === 'HEAD' ? shortFromCommitId : fromRefName;
  const toDisplay = toRefName === 'HEAD' ? shortToCommitId : toRefName;
  const homePage = getHomePage();
  const commitUrl = homePage ? `${homePage}/-/commit/${shortToCommitId}` : '';
  return `
## ${dateStr}

${branchName} ${fromDisplay}(${shortFromCommitId})...${toDisplay}(${shortToCommitId})
${commitUrl}

`;
}

const TYPE_ORDER = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'chore', 'ci', 'build', 'revert', 'version', 'other'];

// 为单个区间生成 changelog 内容，返回 { content, commitCount } 或 null（无符合规范的提交或区间无效）
function generateChangelogForRange(fromRefName, toRefName, author) {
  if (!validateRef(fromRefName) || !validateRef(toRefName)) return null;
  const fromCommitId = resolveRef(fromRefName);
  const toCommitId = resolveRef(toRefName);
  if (fromCommitId === toCommitId) return null;
  if (!isAncestorOf(fromRefName, toRefName)) return null;

  const gitRange = `${fromRefName}^..${toRefName}`;
  let gitLogCommand = `git log --oneline --format="%an\t%h\t%s" ${gitRange}`;
  if (author) gitLogCommand += ` --author="${author}"`;
  const logOutput = execSync(gitLogCommand, { encoding: 'utf-8' });
  const lines = logOutput.trim().split('\n').filter((line) => line.trim());

  const commits = [];
  for (const line of lines) {
    const tabIndex1 = line.indexOf('\t');
    const tabIndex2 = tabIndex1 >= 0 ? line.indexOf('\t', tabIndex1 + 1) : -1;
    const commitAuthor = tabIndex1 >= 0 ? line.slice(0, tabIndex1) : '';
    const hash = tabIndex2 >= 0 ? line.slice(tabIndex1 + 1, tabIndex2) : (tabIndex1 >= 0 ? line.slice(tabIndex1 + 1) : '');
    const message = tabIndex2 >= 0 ? line.slice(tabIndex2 + 1) : (tabIndex1 >= 0 ? line.slice(tabIndex1 + 1) : line);
    if (!message) continue;
    const parsed = parseCommitMessage(message);
    if (parsed.type === 'other' && !message.toLowerCase().startsWith('revert')) {
      if (message.toLowerCase().startsWith('merge')) continue;
    }
    commits.push({ ...parsed, hash: hash || '', author: commitAuthor || '' });
  }
  if (commits.length === 0) return null;

  const branchName = getBranchName();
  const header = buildChangelogHeader(fromRefName, fromCommitId, toRefName, toCommitId, branchName);
  let content = header;
  for (const commit of commits) {
    content += `- [${commit.author}] ${commit.hash} ${commit.description}\n`;
  }
  return { content: content.trimEnd(), commitCount: commits.length };
}

// 交互式输入
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// 解析提交信息，提取类型和描述
function parseCommitMessage(message) {
  // 匹配 conventional commits 格式: type(scope): description
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
  if (match) {
    return {
      type: match[1],
      scope: match[2] || '',
      description: match[3],
      raw: message
    };
  }
  // 如果不匹配，尝试匹配简单的 type: description
  const simpleMatch = message.match(/^(\w+):\s*(.+)$/);
  if (simpleMatch) {
    return {
      type: simpleMatch[1],
      scope: '',
      description: simpleMatch[2],
      raw: message
    };
  }
  // 都不匹配，返回原始消息
  return {
    type: 'other',
    scope: '',
    description: message,
    raw: message
  };
}

// 获取类型的中文名称
function getTypeName(type) {
  const typeMap = {
    'feat': '新增',
    'fix': '修复',
    'docs': '文档',
    'style': '样式',
    'refactor': '重构',
    'perf': '优化',
    'test': '测试',
    'chore': '构建',
    'ci': '持续集成',
    'build': '构建系统',
    'revert': '回滚',
    'version': '依赖更新',
    'other': '其他更改'
  };
  return typeMap[type] || '其他更改';
}

// 打印帮助信息
function printHelp() {
  const help = `
Changelog 生成工具 - 基于 git log 生成 Conventional Commits 格式的变更日志

用法:
  yarn changelog [选项] [<from-ref> [to-ref]]

选项:
  -h, --help           显示此帮助信息
  --init               生成完整 changelog：按时间由远到近遍历当前分支所有 tag，逐段生成并合并到 CHANGELOG.md
  --author=<name>      按作者过滤提交

参数:
  from-ref             起始 commit id 或 tag
  to-ref               结束 commit id 或 tag（可选，默认 HEAD）

无参数（yarn changelog）:
  from-ref 为当前分支提交历史中的最后一个 tag，to-ref 为 HEAD，
  输出到项目根目录 CHANGELOG.md（若已存在则往顶部追加）。

有参数（如 yarn changelog v1.0.0）:
  输出到项目目录 ./tmp/ 下的 CHANGELOG-[时间戳].md 文件（若已存在则往顶部追加）。

示例:
  yarn changelog                    从「当前分支最后 tag」到 HEAD，输出到 CHANGELOG.md
  yarn changelog -h                  显示此帮助
  yarn changelog v1.0.0             从 v1.0.0 到 HEAD，输出到./tmp/CHANGELOG-「时间戳」.md 文件
  yarn changelog v1.0.0 v2.0.0      从 v1.0.0 到 v2.0.0，输出到./tmp/CHANGELOG-「时间戳」.md 文件
  yarn changelog --init                按 tag 区间生成完整 changelog 到 CHANGELOG.md
  yarn changelog abc1234 --author=hujing  指定作者过滤
`;
  console.log(help.trim());
}

// 解析命令行参数
function parseArgs() {
  const args = {
    fromCommit: null,
    toCommit: null,
    author: null,
    help: false,
    init: false
  };

  // 解析位置参数和命名参数
  const positionalArgs = [];
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '-h' || arg === '--help') {
      args.help = true;
    } else if (arg === '--init') {
      args.init = true;
    } else if (arg.startsWith('--author=')) {
      args.author = arg.substring('--author='.length);
    } else if (arg === '--author' && i + 1 < process.argv.length) {
      args.author = process.argv[++i];
    } else {
      positionalArgs.push(arg);
    }
  }

  // 位置参数：第一个是 fromCommit，第二个是 toCommit
  if (positionalArgs.length > 0) {
    args.fromCommit = positionalArgs[0];
  }
  if (positionalArgs.length > 1) {
    args.toCommit = positionalArgs[1];
  }

  return args;
}

async function main() {
  const parsedArgs = parseArgs();
  let fromCommit = parsedArgs.fromCommit;
  let toCommit = parsedArgs.toCommit;
  let author = parsedArgs.author;

  if (parsedArgs.help) {
    printHelp();
    process.exit(0);
  }

  if (parsedArgs.init) {
    const tags = getTagsOnBranchSortedByDate();
    if (tags.length === 0) {
      console.error('错误: 当前分支没有 tag，无法生成完整 changelog');
      process.exit(1);
    }
    const author = parsedArgs.author;
    const parts = [];
    let totalCommits = 0;
    for (let i = 0; i < tags.length - 1; i++) {
      console.log(`\n生成区间 ${tags[i]}..${tags[i + 1]}...`);
      const segment = generateChangelogForRange(tags[i], tags[i + 1], author);
      if (segment) {
        parts.push(segment.content);
        totalCommits += segment.commitCount;
        console.log(`  找到 ${segment.commitCount} 个符合规范的提交`);
      }
    }
    console.log(`\n生成区间 ${tags[tags.length - 1]}..HEAD...`);
    const lastSegment = generateChangelogForRange(tags[tags.length - 1], 'HEAD', author);
    if (lastSegment) {
      parts.push(lastSegment.content);
      totalCommits += lastSegment.commitCount;
      console.log(`  找到 ${lastSegment.commitCount} 个符合规范的提交`);
    }
    if (parts.length === 0) {
      console.log('没有找到符合规范的提交');
      process.exit(0);
    }
    const fullContent = parts.join('\n\n');
    fs.writeFileSync('CHANGELOG.md', fullContent, 'utf-8');
    console.log('\n✓ 完整 Changelog 生成完成');
    console.log(`\n共 ${parts.length} 个区间、${totalCommits} 个提交，已保存到 CHANGELOG.md`);
    process.exit(0);
  }

  let fromRefName;
  let toRefName;
  let changelogFile;
  let isTmp;

  if (!fromCommit) {
    try {
      fromRefName = getLastTagOnBranch();
    } catch (e) {
      console.error('错误: 当前分支没有可用的 tag，请先打 tag 或使用 yarn changelog <from-ref> [to-ref] 指定范围');
      process.exit(1);
    }
    toRefName = 'HEAD';
    isTmp = false;
    changelogFile = 'CHANGELOG.md';
  } else {
    fromRefName = fromCommit;
    toRefName = toCommit || 'HEAD';
    isTmp = true;
    changelogFile = path.join('tmp', `CHANGELOG-${getTimestampForFilename()}.md`);
  }

  if (!validateRef(fromRefName)) {
    console.error(`错误: 起始 ref（commit id 或 tag）"${fromRefName}" 不存在`);
    process.exit(1);
  }
  if (!validateRef(toRefName)) {
    console.error(`错误: 结束 ref（commit id 或 tag）"${toRefName}" 不存在`);
    process.exit(1);
  }

  const fromCommitId = resolveRef(fromRefName);
  const toCommitId = resolveRef(toRefName);

  if (fromCommitId === toCommitId) {
    console.error('错误: 两个 ref 不能指向同一提交');
    process.exit(1);
  }
  if (!isAncestorOf(fromRefName, toRefName)) {
    console.error('错误: from-ref 必须是 to-ref 的祖先（from-ref 在前，to-ref 在后），请检查两个 ref 的先后关系');
    process.exit(1);
  }

  const gitRange = `${fromRefName}^..${toRefName}`;
  const range = `${fromRefName} 到 ${toRefName}`;
  const authorFilter = author ? ` (作者: ${author})` : '';

  console.log(`\n生成从 ${range}${authorFilter} 的 changelog...`);
  console.log(`Git 范围: ${gitRange}`);
  if (author) {
    console.log(`作者过滤: ${author}`);
  }
  console.log();

  try {
    let gitLogCommand = `git log --oneline --format="%an\t%h\t%s" ${gitRange}`;
    if (author) {
      gitLogCommand += ` --author="${author}"`;
    }
    const logOutput = execSync(gitLogCommand, { encoding: 'utf-8' });
    
    // 解析提交（格式: 作者\t短hash\tsubject）
    const commits = [];
    const lines = logOutput.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const tabIndex1 = line.indexOf('\t');
      const tabIndex2 = tabIndex1 >= 0 ? line.indexOf('\t', tabIndex1 + 1) : -1;
      const commitAuthor = tabIndex1 >= 0 ? line.slice(0, tabIndex1) : '';
      const hash = tabIndex2 >= 0 ? line.slice(tabIndex1 + 1, tabIndex2) : (tabIndex1 >= 0 ? line.slice(tabIndex1 + 1) : '');
      const message = tabIndex2 >= 0 ? line.slice(tabIndex2 + 1) : (tabIndex1 >= 0 ? line.slice(tabIndex1 + 1) : line);
      if (!message) continue;
      
      // 只处理符合 conventional commits 规范的提交
      const parsed = parseCommitMessage(message);
      
      // 跳过 merge 提交和其他不符合规范的提交（除非是 revert）
      if (parsed.type === 'other' && !message.toLowerCase().startsWith('revert')) {
        // 检查是否是 merge 提交
        if (message.toLowerCase().startsWith('merge')) {
          continue;
        }
      }
      
      commits.push({
        ...parsed,
        hash: hash || '',
        author: commitAuthor || ''
      });
    }

    if (commits.length === 0) {
      console.log('没有找到符合规范的提交');
      process.exit(0);
    }

    console.log(`找到 ${commits.length} 个符合规范的提交\n`);

    const branchName = getBranchName();
    const header = buildChangelogHeader(fromRefName, fromCommitId, toRefName, toCommitId, branchName);

    // 生成 changelog 内容（无编号，不区分类型）
    let changelog = header;
    for (const commit of commits) {
      changelog += `- [${commit.author}] ${commit.hash} ${commit.description}\n`;
    }

    const changelogDir = path.dirname(changelogFile);
    if (changelogDir) {
      fs.mkdirSync(changelogDir, { recursive: true });
    }
    if (fs.existsSync(changelogFile)) {
      const existing = fs.readFileSync(changelogFile, 'utf-8');
      changelog = changelog.trimEnd() + '\n\n' + existing;
    }
    fs.writeFileSync(changelogFile, changelog, 'utf-8');

    console.log('✓ Changelog 生成完成');
    console.log(`\n生成的 changelog 包含 ${commits.length} 个提交，已保存到 ${changelogFile}`);
    
  } catch (error) {
    console.error('\n✗ Changelog 生成失败');
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('发生错误:', error.message);
  process.exit(1);
});
