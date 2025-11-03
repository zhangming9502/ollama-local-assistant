import * as vscode from 'vscode';
import { OllamaClient } from './ollamaClient';

// 全局变量
let ollamaClient: OllamaClient;
let outputChannel: vscode.OutputChannel;

/**
 * 初始化插件
 */
export function activate(context: vscode.ExtensionContext) {
    // 创建输出通道用于显示响应
    outputChannel = vscode.window.createOutputChannel('Ollama 本地大模型');
    outputChannel.show();

    // 获取配置
    const config = vscode.workspace.getConfiguration('ollama');
    const baseUrl = config.get<string>('baseUrl', 'http://127.0.0.1:11434');
    const model = config.get<string>('model', 'llama3');
    const timeout = config.get<number>('timeout', 60000);

    // 初始化客户端
    ollamaClient = new OllamaClient(baseUrl, model, timeout);

    // 注册命令
    const commands = [
        vscode.commands.registerCommand('ollama.checkConnection', checkConnectionCommand),
        vscode.commands.registerCommand('ollama.askQuestion', askQuestion),
        vscode.commands.registerCommand('ollama.explainCode', explainCode),
        vscode.commands.registerCommand('ollama.refactorCode', refactorCode),
        vscode.commands.registerCommand('ollama.generateCode', generateCode),
        vscode.commands.registerCommand('ollama.setModel', setModel),
        vscode.commands.registerCommand('ollama.readFile', readFile),
        vscode.commands.registerCommand('ollama.writeFile', writeFile),
        vscode.commands.registerCommand('ollama.listWorkspaceFiles', listWorkspaceFiles),
        vscode.commands.registerCommand('ollama.processFile', processFile)
    ];

    // 添加到订阅列表
    commands.forEach(command => context.subscriptions.push(command));

    // 监听配置更改
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('ollama')) {
                const config = vscode.workspace.getConfiguration('ollama');
                const baseUrl = config.get<string>('baseUrl', 'http://127.0.0.1:11434');
                const model = config.get<string>('model', 'llama3');
                const timeout = config.get<number>('timeout', 60000);
                ollamaClient.updateConfig(baseUrl, model, timeout);
                outputChannel.appendLine('配置已更新');
            }
        })
    );

    // 检查连接
    checkConnection();

    outputChannel.appendLine('Ollama 本地大模型助手已激活');
}

/**
 * 检查 Ollama 连接（内部调用，启动时自动检测）
 */
async function checkConnection() {
    try {
        const isConnected = await ollamaClient.checkHealth();
        if (isConnected) {
            outputChannel.appendLine('✓ 已连接到 Ollama 服务');
        } else {
            outputChannel.appendLine('✗ 无法连接到 Ollama 服务，请确保 Ollama 正在运行');
            vscode.window.showWarningMessage('无法连接到 Ollama 服务，请确保 Ollama 正在运行');
        }
    } catch (error) {
        outputChannel.appendLine(`✗ 连接检查失败: ${error}`);
        vscode.window.showWarningMessage('无法连接到 Ollama 服务');
    }
}

/**
 * 命令：检测 Ollama 连接状态（详细版）
 */
async function checkConnectionCommand() {
    // 显示进度提示
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: '正在检测 Ollama 连接...',
            cancellable: false
        },
        async (progress) => {
            try {
                // 获取当前配置
                const config = vscode.workspace.getConfiguration('ollama');
                const baseUrl = config.get<string>('baseUrl', 'http://127.0.0.1:11434');
                const model = config.get<string>('model', 'llama3');
                const timeout = config.get<number>('timeout', 60000);

                // 清空输出通道并显示检测信息
                outputChannel.clear();
                outputChannel.show(true);
                outputChannel.appendLine('=== Ollama 连接检测 ===');
                outputChannel.appendLine('');
                outputChannel.appendLine('当前配置:');
                outputChannel.appendLine(`  - API 地址: ${baseUrl}`);
                outputChannel.appendLine(`  - 默认模型: ${model}`);
                outputChannel.appendLine(`  - 超时时间: ${timeout}ms`);
                outputChannel.appendLine('');

                progress.report({ increment: 30, message: '正在检查服务连接...' });

                // 检测连接
                const isConnected = await ollamaClient.checkHealth();
                
                if (isConnected) {
                    outputChannel.appendLine('✓ 连接状态: 已连接');
                    
                    progress.report({ increment: 50, message: '正在获取可用模型...' });

                    // 获取可用模型列表
                    try {
                        const models = await ollamaClient.listModels();
                        outputChannel.appendLine('');
                        outputChannel.appendLine(`可用模型 (共 ${models.length} 个):`);
                        
                        if (models.length > 0) {
                            models.forEach((m, index) => {
                                const isCurrentModel = m === model;
                                const marker = isCurrentModel ? '👉' : '  ';
                                outputChannel.appendLine(`${marker} ${index + 1}. ${m}${isCurrentModel ? ' (当前使用)' : ''}`);
                            });
                        } else {
                            outputChannel.appendLine('  (无可用模型，请使用 "ollama pull <model>" 下载模型)');
                        }
                    } catch (modelError: any) {
                        outputChannel.appendLine(`  ⚠️ 获取模型列表失败: ${modelError.message}`);
                    }

                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== 检测完成：服务正常 ===');
                    
                    // 显示成功通知
                    vscode.window.showInformationMessage(
                        `✓ Ollama 连接正常 (${baseUrl})`,
                        '查看详情'
                    ).then(selection => {
                        if (selection === '查看详情') {
                            outputChannel.show(true);
                        }
                    });

                } else {
                    outputChannel.appendLine('✗ 连接状态: 连接失败');
                    outputChannel.appendLine('');
                    outputChannel.appendLine('可能的原因:');
                    outputChannel.appendLine('  1. Ollama 服务未启动');
                    outputChannel.appendLine('  2. API 地址配置不正确');
                    outputChannel.appendLine('  3. 网络连接问题');
                    outputChannel.appendLine('');
                    outputChannel.appendLine('解决方案:');
                    outputChannel.appendLine('  1. 检查 Ollama 是否正在运行: ollama serve');
                    outputChannel.appendLine('  2. 检查 API 地址是否正确');
                    outputChannel.appendLine('  3. 尝试在浏览器中访问: ' + baseUrl + '/api/tags');
                    outputChannel.appendLine('');
                    outputChannel.appendLine('=== 检测完成：连接失败 ===');
                    
                    // 显示错误通知
                    vscode.window.showErrorMessage(
                        `✗ 无法连接到 Ollama 服务 (${baseUrl})`,
                        '查看详情'
                    ).then(selection => {
                        if (selection === '查看详情') {
                            outputChannel.show(true);
                        }
                    });
                }

            } catch (error: any) {
                const errorMessage = error.message || '未知错误';
                outputChannel.appendLine('');
                outputChannel.appendLine(`✗ 检测过程出错: ${errorMessage}`);
                outputChannel.appendLine('');
                outputChannel.appendLine('=== 检测失败 ===');
                
                vscode.window.showErrorMessage(
                    `连接检测失败: ${errorMessage}`,
                    '查看详情'
                ).then(selection => {
                    if (selection === '查看详情') {
                        outputChannel.show(true);
                    }
                });
            }
        }
    );
}

/**
 * 通用生成函数，显示进度并使用流式输出
 */
async function generateWithProgress(
    prompt: string,
    systemPrompt?: string,
    title: string = '生成中...'
): Promise<string> {
    return new Promise((resolve, reject) => {
        let fullResponse = '';
        
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: title,
                cancellable: false
            },
            async (progress) => {
                try {
                    // 清空输出通道
                    outputChannel.clear();
                    outputChannel.appendLine(`提示词: ${prompt}`);
                    outputChannel.appendLine('---');
                    
                    // 使用流式生成以实时显示响应
                    await ollamaClient.generateStream(
                        prompt,
                        (chunk: string) => {
                            fullResponse += chunk;
                            outputChannel.append(chunk);
                        },
                        systemPrompt
                    );
                    
                    outputChannel.appendLine('\n---');
                    outputChannel.appendLine('完成');
                    
                    resolve(fullResponse);
                } catch (error: any) {
                    const errorMessage = error.message || '生成失败';
                    outputChannel.appendLine(`\n错误: ${errorMessage}`);
                    vscode.window.showErrorMessage(`Ollama 错误: ${errorMessage}`);
                    reject(error);
                }
            }
        );
    });
}

/**
 * 命令：向 Ollama 提问
 */
async function askQuestion() {
    const question = await vscode.window.showInputBox({
        prompt: '请输入你的问题',
        placeHolder: '例如：解释什么是闭包？'
    });

    if (!question) {
        return;
    }

    try {
        await generateWithProgress(question, undefined, '正在思考...');
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
    }
}

/**
 * 将文本转换为适合特定语言的注释格式
 */
function formatAsComment(text: string, language: string): string {
    // 按行分割，清理每行的前后空白
    const lines = text.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // 根据语言选择合适的注释格式
    const commentMap: { [key: string]: { single: string; multiStart: string; multiEnd: string; isJsx?: boolean } } = {
        'javascript': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'typescript': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'javascriptreact': { single: '// ', multiStart: '{/*', multiEnd: '*/}', isJsx: true },
        'typescriptreact': { single: '// ', multiStart: '{/*', multiEnd: '*/}', isJsx: true },
        'jsx': { single: '// ', multiStart: '{/*', multiEnd: '*/}', isJsx: true },
        'tsx': { single: '// ', multiStart: '{/*', multiEnd: '*/}', isJsx: true },
        'java': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'c': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'cpp': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'csharp': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'go': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'rust': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'swift': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'kotlin': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'python': { single: '# ', multiStart: '"""', multiEnd: '"""' },
        'ruby': { single: '# ', multiStart: '=begin', multiEnd: '=end' },
        'php': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'html': { single: '', multiStart: '<!--', multiEnd: '-->' },
        'xml': { single: '', multiStart: '<!--', multiEnd: '-->' },
        'css': { single: '', multiStart: '/*', multiEnd: '*/' },
        'scss': { single: '// ', multiStart: '/*', multiEnd: '*/' },
        'sql': { single: '-- ', multiStart: '/*', multiEnd: '*/' },
        'shellscript': { single: '# ', multiStart: '', multiEnd: '' },
        'bash': { single: '# ', multiStart: '', multiEnd: '' },
        'powershell': { single: '# ', multiStart: '<#', multiEnd: '#>' },
        'r': { single: '# ', multiStart: '', multiEnd: '' },
        'lua': { single: '-- ', multiStart: '--[[', multiEnd: ']]' },
        'haskell': { single: '-- ', multiStart: '{-', multiEnd: '-}' },
        'matlab': { single: '% ', multiStart: '%{', multiEnd: '%}' },
        'yaml': { single: '# ', multiStart: '', multiEnd: '' },
        'toml': { single: '# ', multiStart: '', multiEnd: '' },
        'ini': { single: '; ', multiStart: '', multiEnd: '' },
        'properties': { single: '# ', multiStart: '', multiEnd: '' }
    };

    const commentStyle = commentMap[language] || { single: '// ', multiStart: '/*', multiEnd: '*/' };
    
    // 如果只有一行，使用单行注释；否则使用多行注释
    if (lines.length === 1) {
        // JSX 中单行注释也应该使用 {/* */} 格式
        if (commentStyle.isJsx) {
            return commentStyle.multiStart + ' ' + lines[0] + ' ' + commentStyle.multiEnd;
        }
        return commentStyle.single + lines[0];
    } else {
        // 使用多行注释格式
        if (commentStyle.multiStart && commentStyle.multiEnd) {
            // 对于块注释，将每行用单行注释格式，或者使用块注释
            if (commentStyle.isJsx) {
                // JSX/TSX 使用 {/* */} 格式，多行内容合并为一行
                return commentStyle.multiStart + ' ' + lines.join(' ') + ' ' + commentStyle.multiEnd;
            } else if (language === 'python') {
                // Python 使用三引号
                return commentStyle.multiStart + '\n' + lines.join('\n') + '\n' + commentStyle.multiEnd;
            } else if (language === 'html' || language === 'xml') {
                // HTML/XML 使用 <!-- -->
                return commentStyle.multiStart + ' ' + lines.join(' ') + ' ' + commentStyle.multiEnd;
            } else {
                // 其他语言使用块注释，每行单独注释或整个块注释
                // 为了更好的可读性，对较短的注释使用块注释，对较长的使用多行单行注释
                if (lines.length <= 5) {
                    return commentStyle.multiStart + '\n * ' + lines.join('\n * ') + '\n ' + commentStyle.multiEnd;
                } else {
                    // 长注释使用单行注释格式
                    return lines.map(line => commentStyle.single + line).join('\n');
                }
            }
        } else {
            // 没有多行注释格式，使用单行注释
            return lines.map(line => commentStyle.single + line).join('\n');
        }
    }
}

/**
 * 命令：解释选中代码
 */
async function explainCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件并选中代码');
        return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('请先选中要解释的代码');
        return;
    }

    const language = editor.document.languageId;
    const prompt = `请详细解释以下 ${language} 代码的功能、工作原理和关键概念。请用简洁明了的语言，控制在5-10行以内：\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    const systemPrompt = '你是一个专业的代码解释助手。请用中文详细解释代码的功能和原理，解释要简洁明了，适合作为代码注释。';

    try {
        const explanation = await generateWithProgress(prompt, systemPrompt, '正在分析代码...');
        
        // 询问用户是否要将解释作为注释插入
        const shouldInsert = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否将解释作为注释插入到代码上方？' }
        );

        if (shouldInsert === '是' && editor) {
            // 获取选中区域的位置
            const selectionStart = editor.selection.start;
            const selectionLine = selectionStart.line;
            
            // 格式化解释为注释
            const comment = formatAsComment(explanation, language);
            
            // 在选中代码的上方插入空行和注释
            const insertPosition = new vscode.Position(selectionLine, 0);
            
            await editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, comment + '\n\n');
            });
            
            vscode.window.showInformationMessage('解释已作为注释插入');
        }
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
    }
}

/**
 * 从 AI 响应中提取代码内容（去除 markdown 格式和额外文本）
 */
function extractCode(response: string): string {
    let code = response.trim();
    
    // 尝试提取代码块中的内容（支持多种格式）
    // 匹配 ```language\ncode\n```
    const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        code = codeBlockMatch[1];
    } else {
        // 尝试匹配 ```code```（没有语言标识）
        const simpleCodeBlockMatch = code.match(/```\n([\s\S]*?)\n```/);
        if (simpleCodeBlockMatch) {
            code = simpleCodeBlockMatch[1];
        } else {
            // 尝试匹配 ```code```（单行或多行，无换行）
            const inlineCodeBlockMatch = code.match(/```([\s\S]*?)```/);
            if (inlineCodeBlockMatch) {
                code = inlineCodeBlockMatch[1];
            }
        }
    }
    
    // 去除前后空白
    code = code.trim();
    
    // 如果响应中包含"重构后"、"优化后"等提示词，尝试提取后面的代码
    const refactoredMatch = code.match(/(?:重构后|优化后|修改后)[：:：\s]*([\s\S]*)/i);
    if (refactoredMatch && refactoredMatch[1]) {
        code = refactoredMatch[1].trim();
        // 再次尝试提取代码块
        const nestedCodeBlock = code.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (nestedCodeBlock) {
            code = nestedCodeBlock[1];
        }
    }
    
    return code;
}

/**
 * 命令：重构选中代码
 */
async function refactorCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件并选中代码');
        return;
    }

    const selection = editor.document.getText(editor.selection);
    if (!selection) {
        vscode.window.showWarningMessage('请先选中要重构的代码');
        return;
    }

    const language = editor.document.languageId;
    const selectionRange = editor.selection; // 保存原始选中范围
    
    const prompt = `请重构以下 ${language} 代码，使其更清晰、高效、易维护。请只返回重构后的代码，不需要额外解释：\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    const systemPrompt = '你是一个专业的代码重构助手。请提供优化后的代码，保持原有功能不变。只返回代码，不要添加任何解释文字。';

    try {
        const refactoredCode = await generateWithProgress(prompt, systemPrompt, '正在重构代码...');
        
        // 提取重构后的代码
        let code = extractCode(refactoredCode);
        
        if (!code || code.length === 0) {
            vscode.window.showWarningMessage('未能从响应中提取有效代码，请查看输出面板查看完整响应');
            return;
        }
        
        // 显示重构后的代码预览
        outputChannel.appendLine('\n=== 重构后的代码预览 ===');
        outputChannel.appendLine(code);
        outputChannel.appendLine('===');
        outputChannel.show(true);
        
        // 询问用户是否确认应用重构结果
        const shouldApply = await vscode.window.showQuickPick(
            [
                { label: '✓ 确认应用', value: 'yes', description: '将重构后的代码覆盖选中的代码' },
                { label: '✗ 取消', value: 'no', description: '不应用重构结果' }
            ],
            { placeHolder: '请确认重构后的代码是否满足要求，确认后将覆盖选中的代码' }
        );

        if (shouldApply?.value === 'yes' && editor) {
            // 再次获取编辑器（确保编辑器仍然存在）
            const currentEditor = vscode.window.activeTextEditor;
            if (!currentEditor) {
                vscode.window.showWarningMessage('编辑器已关闭，无法应用重构结果');
                return;
            }
            
            // 应用重构后的代码
            await currentEditor.edit(editBuilder => {
                editBuilder.replace(selectionRange, code);
            });
            
            vscode.window.showInformationMessage('✓ 代码已重构并应用到文件中');
            outputChannel.appendLine('✓ 重构后的代码已应用到文件');
        } else {
            outputChannel.appendLine('✗ 用户取消应用重构结果');
        }
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
    }
}

/**
 * 创建文件（带权限处理）
 */
async function createFileWithPermission(uri: vscode.Uri, content: string): Promise<boolean> {
    try {
        // 确保父目录存在
        const parentDir = vscode.Uri.joinPath(uri, '..');
        try {
            await vscode.workspace.fs.stat(parentDir);
        } catch {
            // 父目录不存在，尝试创建（如果权限允许）
            // VS Code API 不支持直接创建目录，这里先尝试写入文件
            // 如果失败，会在下面的 catch 中处理
        }

        // 写入文件
        const encoder = new TextEncoder();
        const fileData = encoder.encode(content);
        await vscode.workspace.fs.writeFile(uri, fileData);
        return true;
    } catch (error: any) {
        const errorMessage = error.message || '未知错误';
        
        // 检查是否是权限错误
        if (errorMessage.includes('permission') || errorMessage.includes('权限') || 
            errorMessage.includes('EACCES') || errorMessage.includes('access denied')) {
            
            const permissionAction = await vscode.window.showWarningMessage(
                `无法创建文件：权限不足\n\n路径：${uri.fsPath}\n\n在 Mac 上，如果文件路径在工作区外，可能需要授予 VS Code 文件访问权限。`,
                '重试',
                '取消'
            );
            
            if (permissionAction === '重试') {
                // 提示用户手动授予权限
                const helpAction = await vscode.window.showInformationMessage(
                    '请在系统设置中授予 VS Code 文件访问权限，然后重试。\n\nMac: 系统设置 > 隐私与安全性 > 文件和文件夹 > VS Code',
                    '查看帮助',
                    '取消'
                );
                
                if (helpAction === '查看帮助') {
                    vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/editor/workspace-trust'));
                }
            }
            
            return false;
        } else {
            // 其他错误
            vscode.window.showErrorMessage(`创建文件失败: ${errorMessage}`);
            outputChannel.appendLine(`创建文件失败: ${errorMessage}`);
            return false;
        }
    }
}

/**
 * 命令：生成代码
 */
async function generateCode() {
    const description = await vscode.window.showInputBox({
        prompt: '请描述你想要生成的代码',
        placeHolder: '例如：创建一个计算斐波那契数列的函数'
    });

    if (!description) {
        return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId || 'javascript';
    
    const prompt = `请生成 ${language} 代码来实现：${description}\n\n请只返回代码，使用代码块格式。`;
    const systemPrompt = '你是一个专业的代码生成助手。请生成清晰、高效、符合最佳实践的代码。';

    try {
        const generatedCode = await generateWithProgress(prompt, systemPrompt, '正在生成代码...');
        
        // 提取生成的代码
        let code = extractCode(generatedCode);
        
        if (!code || code.length === 0) {
            vscode.window.showWarningMessage('未能从响应中提取有效代码，请查看输出面板查看完整响应');
            return;
        }
        
        // 显示生成的代码预览
        outputChannel.appendLine('\n=== 生成的代码预览 ===');
        outputChannel.appendLine(code);
        outputChannel.appendLine('===');
        outputChannel.show(true);
        
        // 询问用户是否确认代码没问题
        const isOk = await vscode.window.showQuickPick(
            [
                { label: '✓ 确认，继续', value: 'yes', description: '代码没问题，选择插入位置' },
                { label: '✗ 取消', value: 'no', description: '不应用生成的代码' }
            ],
            { placeHolder: '请确认生成的代码是否满足要求' }
        );

        if (isOk?.value !== 'yes') {
            outputChannel.appendLine('✗ 用户取消应用生成的代码');
            return;
        }
        
        // 询问用户插入位置
        const insertOption = await vscode.window.showQuickPick(
            [
                { label: '在当前文件尾部插入', value: 'append', description: '将代码追加到当前打开文件的末尾' },
                { label: '创建新文件', value: 'new', description: '将代码写入新创建的文件' }
            ],
            { placeHolder: '请选择代码插入位置' }
        );

        if (!insertOption) {
            return;
        }

        if (insertOption.value === 'append') {
            // 在当前文件尾部插入
            if (!editor) {
                vscode.window.showWarningMessage('没有打开的文件，无法插入代码');
                return;
            }

            const document = editor.document;
            const lastLine = document.lineAt(document.lineCount - 1);
            const insertPosition = new vscode.Position(document.lineCount, lastLine.text.length);

            await editor.edit(editBuilder => {
                // 如果最后一行不是空行，先插入换行
                if (lastLine.text.trim().length > 0) {
                    editBuilder.insert(insertPosition, '\n\n' + code);
                } else {
                    editBuilder.insert(insertPosition, '\n' + code);
                }
            });

            vscode.window.showInformationMessage('✓ 代码已插入到文件尾部');
            outputChannel.appendLine('✓ 代码已插入到文件尾部');
        } else if (insertOption.value === 'new') {
            // 创建新文件
            let filePath = await vscode.window.showInputBox({
                prompt: '请输入文件路径（支持相对路径和绝对路径）',
                placeHolder: '例如：src/utils/helper.ts 或 /Users/name/project/file.ts',
                validateInput: (value) => {
                    if (!value || value.trim().length === 0) {
                        return '文件路径不能为空';
                    }
                    return null;
                }
            });

            if (!filePath) {
                return;
            }

            filePath = filePath.trim();
            let targetUri: vscode.Uri;

            // 判断是绝对路径还是相对路径
            if (filePath.startsWith('/') || filePath.match(/^[A-Za-z]:/)) {
                // 绝对路径
                targetUri = vscode.Uri.file(filePath);
            } else {
                // 相对路径（相对于工作区根目录）
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('请先打开一个工作区，或使用绝对路径');
                    return;
                }
                targetUri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
            }

            // 检查文件是否已存在
            try {
                await vscode.workspace.fs.stat(targetUri);
                const overwrite = await vscode.window.showWarningMessage(
                    `文件已存在：${targetUri.fsPath}`,
                    '覆盖',
                    '取消'
                );
                if (overwrite !== '覆盖') {
                    return;
                }
            } catch {
                // 文件不存在，可以继续
            }

            // 创建文件（带权限处理）
            const success = await createFileWithPermission(targetUri, code);

            if (success) {
                // 打开文件
                try {
                    const document = await vscode.workspace.openTextDocument(targetUri);
                    await vscode.window.showTextDocument(document);
                    vscode.window.showInformationMessage(`✓ 代码已写入文件: ${targetUri.fsPath}`);
                    outputChannel.appendLine(`✓ 代码已写入文件: ${targetUri.fsPath}`);
                } catch (error: any) {
                    // 文件已创建，但打开失败（可能文件在工作区外）
                    vscode.window.showInformationMessage(`✓ 代码已写入文件: ${targetUri.fsPath}（请手动打开文件）`);
                    outputChannel.appendLine(`✓ 代码已写入文件: ${targetUri.fsPath}`);
                }
            }
        }
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
    }
}

/**
 * 命令：设置使用的模型
 */
async function setModel() {
    try {
        // 获取可用模型列表
        const models = await ollamaClient.listModels();
        
        if (models.length === 0) {
            vscode.window.showWarningMessage('未找到可用模型，请确保已安装模型');
            return;
        }

        // 让用户选择模型
        const selectedModel = await vscode.window.showQuickPick(models, {
            placeHolder: '请选择要使用的模型'
        });

        if (selectedModel) {
            // 更新配置
            const config = vscode.workspace.getConfiguration('ollama');
            await config.update('model', selectedModel, vscode.ConfigurationTarget.Global);
            
            // 更新客户端
            const baseUrl = config.get<string>('baseUrl', 'http://127.0.0.1:11434');
            const timeout = config.get<number>('timeout', 60000);
            ollamaClient.updateConfig(baseUrl, selectedModel, timeout);
            
            vscode.window.showInformationMessage(`已切换到模型: ${selectedModel}`);
            outputChannel.appendLine(`已切换到模型: ${selectedModel}`);
        }
    } catch (error: any) {
        const errorMessage = error.message || '获取模型列表失败';
        vscode.window.showErrorMessage(`设置模型失败: ${errorMessage}`);
        outputChannel.appendLine(`错误: ${errorMessage}`);
    }
}

/**
 * 命令：读取文件并分析
 */
async function readFile() {
    // 首先让用户选择要读取的文件
    const fileUri = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        openLabel: '选择要分析的文件'
    });

    if (!fileUri || fileUri.length === 0) {
        return;
    }

    const uri = fileUri[0];
    
    try {
        // 读取文件内容
        const document = await vscode.workspace.openTextDocument(uri);
        const content = document.getText();
        const fileName = uri.fsPath.split(/[/\\]/).pop() || uri.fsPath;
        const language = document.languageId;

        // 询问用户想要对文件做什么
        const action = await vscode.window.showQuickPick(
            [
                { label: '分析代码结构', value: 'analyze' },
                { label: '查找潜在问题', value: 'review' },
                { label: '生成文档', value: 'document' },
                { label: '优化建议', value: 'optimize' },
                { label: '自定义分析', value: 'custom' }
            ],
            { placeHolder: '选择要对文件执行的操作' }
        );

        if (!action) {
            return;
        }

        let prompt = '';
        let systemPrompt = '';

        switch (action.value) {
            case 'analyze':
                prompt = `请分析以下 ${language} 文件的代码结构、主要功能和模块组织：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
                systemPrompt = '你是一个专业的代码分析助手。请详细分析代码的结构和组织方式。';
                break;
            case 'review':
                prompt = `请审查以下 ${language} 代码，查找潜在的问题、bug、性能问题或改进建议：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
                systemPrompt = '你是一个专业的代码审查助手。请仔细检查代码，找出可能的问题和改进建议。';
                break;
            case 'document':
                prompt = `请为以下 ${language} 代码生成详细的文档说明：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
                systemPrompt = '你是一个专业的文档生成助手。请生成清晰、完整的代码文档。';
                break;
            case 'optimize':
                prompt = `请分析以下 ${language} 代码并提供优化建议：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
                systemPrompt = '你是一个专业的代码优化助手。请提供具体的优化建议和改进方案。';
                break;
            case 'custom':
                const customPrompt = await vscode.window.showInputBox({
                    prompt: '请输入你的自定义分析需求',
                    placeHolder: '例如：检查代码是否符合最佳实践'
                });
                if (!customPrompt) {
                    return;
                }
                prompt = `${customPrompt}\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
                systemPrompt = '你是一个专业的代码分析助手。请根据用户的需求分析代码。';
                break;
        }

        await generateWithProgress(prompt, systemPrompt, `正在分析文件: ${fileName}...`);
    } catch (error: any) {
        const errorMessage = error.message || '读取文件失败';
        vscode.window.showErrorMessage(`读取文件失败: ${errorMessage}`);
        outputChannel.appendLine(`错误: ${errorMessage}`);
    }
}

/**
 * 命令：将 AI 输出写入文件
 */
async function writeFile() {
    // 首先让用户输入想要生成的内容描述
    const description = await vscode.window.showInputBox({
        prompt: '请描述你想要生成并写入文件的内容',
        placeHolder: '例如：创建一个用户管理模块'
    });

    if (!description) {
        return;
    }

    // 让用户选择目标文件或输入新文件名
    const fileOption = await vscode.window.showQuickPick(
        [
            { label: '选择现有文件', value: 'existing' },
            { label: '创建新文件', value: 'new' }
        ],
        { placeHolder: '选择文件操作' }
    );

    if (!fileOption) {
        return;
    }

    let targetUri: vscode.Uri | undefined;

    if (fileOption.value === 'existing') {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            openLabel: '选择要写入的文件'
        });

        if (!fileUri || fileUri.length === 0) {
            return;
        }

        targetUri = fileUri[0];
    } else {
        const fileName = await vscode.window.showInputBox({
            prompt: '请输入新文件名（包含路径，相对于工作区根目录）',
            placeHolder: '例如：src/utils/helper.ts'
        });

        if (!fileName) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }

        targetUri = vscode.Uri.joinPath(workspaceFolder.uri, fileName);

        // 检查文件是否已存在
        try {
            await vscode.workspace.fs.stat(targetUri);
            const overwrite = await vscode.window.showWarningMessage(
                '文件已存在，是否覆盖？',
                '是',
                '否'
            );
            if (overwrite !== '是') {
                return;
            }
        } catch {
            // 文件不存在，可以继续
        }
    }

    // 获取当前编辑器语言（如果打开的话）或从文件名推断
    const editor = vscode.window.activeTextEditor;
    let language = editor?.document.languageId || 'text';
    
    if (targetUri && targetUri.fsPath) {
        const ext = targetUri.fsPath.split('.').pop()?.toLowerCase();
        const extToLang: { [key: string]: string } = {
            'ts': 'typescript',
            'js': 'javascript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown'
        };
        if (ext && extToLang[ext]) {
            language = extToLang[ext];
        }
    }

    const prompt = `请生成 ${language} 代码来实现：${description}\n\n请只返回代码，使用代码块格式。`;
    const systemPrompt = '你是一个专业的代码生成助手。请生成清晰、高效、符合最佳实践的代码。';

    try {
        const generatedCode = await generateWithProgress(prompt, systemPrompt, '正在生成代码...');

        // 提取代码（去除可能的 markdown 格式）
        let code = generatedCode.trim();
        const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
            code = codeBlockMatch[1];
        }

        // 写入文件
        if (targetUri) {
            const encoder = new TextEncoder();
            const fileData = encoder.encode(code);
            await vscode.workspace.fs.writeFile(targetUri, fileData);

            // 打开文件
            const document = await vscode.workspace.openTextDocument(targetUri);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`代码已写入文件: ${targetUri.fsPath}`);
        }
    } catch (error: any) {
        const errorMessage = error.message || '写入文件失败';
        vscode.window.showErrorMessage(`写入文件失败: ${errorMessage}`);
        outputChannel.appendLine(`错误: ${errorMessage}`);
    }
}

/**
 * 命令：列出工作区文件
 */
async function listWorkspaceFiles() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showWarningMessage('请先打开一个工作区');
        return;
    }

    try {
        // 使用 VS Code API 搜索文件
        const files = await vscode.workspace.findFiles(
            '**/*',
            '**/node_modules/**,**/.git/**,**/out/**,**/dist/**',
            100 // 限制最多100个文件
        );

        if (files.length === 0) {
            vscode.window.showInformationMessage('工作区中没有找到文件');
            return;
        }

        // 显示文件列表供用户选择
        const fileItems = files.map(uri => ({
            label: vscode.workspace.asRelativePath(uri),
            uri: uri
        }));

        const selected = await vscode.window.showQuickPick(fileItems, {
            placeHolder: `选择文件（共 ${files.length} 个）`,
            canPickMany: false
        });

        if (selected) {
            // 打开选中的文件
            const document = await vscode.workspace.openTextDocument(selected.uri);
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`已打开: ${selected.label}`);
        }
    } catch (error: any) {
        const errorMessage = error.message || '列出文件失败';
        vscode.window.showErrorMessage(`列出文件失败: ${errorMessage}`);
        outputChannel.appendLine(`错误: ${errorMessage}`);
    }
}

/**
 * 命令：处理当前文件
 */
async function processFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
    }

    const document = editor.document;
    const content = document.getText();
    const fileName = document.fileName.split(/[/\\]/).pop() || document.fileName;
    const language = document.languageId;

    // 询问用户想要对文件做什么
    const action = await vscode.window.showQuickPick(
        [
            { label: '重构整个文件', value: 'refactor' },
            { label: '优化代码', value: 'optimize' },
            { label: '添加注释和文档', value: 'document' },
            { label: '修复潜在问题', value: 'fix' },
            { label: '代码审查', value: 'review' },
            { label: '自定义处理', value: 'custom' }
        ],
        { placeHolder: `选择要对文件 "${fileName}" 执行的操作` }
    );

    if (!action) {
        return;
    }

    let prompt = '';
    let systemPrompt = '';

    switch (action.value) {
        case 'refactor':
            prompt = `请重构以下 ${language} 文件，使其更清晰、高效、易维护。请返回完整的重构后代码：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的代码重构助手。请提供优化后的完整代码，保持原有功能不变。';
            break;
        case 'optimize':
            prompt = `请优化以下 ${language} 代码的性能和可读性。请返回优化后的完整代码：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的代码优化助手。请提供优化后的完整代码。';
            break;
        case 'document':
            prompt = `请为以下 ${language} 代码添加详细的注释和文档。请返回完整代码：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的文档助手。请添加清晰、完整的注释和文档。';
            break;
        case 'fix':
            prompt = `请审查并修复以下 ${language} 代码中的潜在问题、bug 和错误。请返回修复后的完整代码：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的代码审查助手。请修复代码中的问题并返回完整代码。';
            break;
        case 'review':
            prompt = `请审查以下 ${language} 代码并提供详细的分析报告：\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的代码审查助手。请提供详细的代码审查报告。';
            break;
        case 'custom':
            const customPrompt = await vscode.window.showInputBox({
                prompt: '请输入你的自定义处理需求',
                placeHolder: '例如：将函数改为异步版本'
            });
            if (!customPrompt) {
                return;
            }
            prompt = `${customPrompt}\n\n文件：${fileName}\n\n\`\`\`${language}\n${content}\n\`\`\``;
            systemPrompt = '你是一个专业的代码处理助手。请根据用户的需求处理代码。';
            break;
    }

    try {
        const result = await generateWithProgress(prompt, systemPrompt, `正在处理文件: ${fileName}...`);

        // 如果是需要返回代码的操作，询问是否替换
        if (action.value !== 'review') {
            const shouldReplace = await vscode.window.showQuickPick(
                ['是', '否'],
                { placeHolder: `是否将处理后的代码应用到文件 "${fileName}"？` }
            );

            if (shouldReplace === '是' && editor) {
                // 提取代码
                let code = result.trim();
                const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
                if (codeBlockMatch) {
                    code = codeBlockMatch[1];
                }

                // 替换整个文件内容
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );

                await editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, code);
                });

                vscode.window.showInformationMessage(`文件 "${fileName}" 已更新`);
            }
        }
    } catch (error: any) {
        const errorMessage = error.message || '处理文件失败';
        vscode.window.showErrorMessage(`处理文件失败: ${errorMessage}`);
        outputChannel.appendLine(`错误: ${errorMessage}`);
    }
}

/**
 * 插件停用时的清理工作
 */
export function deactivate() {
    outputChannel?.dispose();
}

