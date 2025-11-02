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
        vscode.commands.registerCommand('ollama.setModel', setModel)
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
    const prompt = `请详细解释以下 ${language} 代码的功能、工作原理和关键概念：\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    const systemPrompt = '你是一个专业的代码解释助手。请用中文详细解释代码的功能和原理。';

    try {
        await generateWithProgress(prompt, systemPrompt, '正在分析代码...');
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
    }
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
    const prompt = `请重构以下 ${language} 代码，使其更清晰、高效、易维护。请只返回重构后的代码，不需要额外解释：\n\n\`\`\`${language}\n${selection}\n\`\`\``;
    const systemPrompt = '你是一个专业的代码重构助手。请提供优化后的代码，保持原有功能不变。';

    try {
        const refactoredCode = await generateWithProgress(prompt, systemPrompt, '正在重构代码...');
        
        // 询问用户是否要应用重构结果
        const shouldApply = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否将重构后的代码应用到当前文件？' }
        );

        if (shouldApply === '是' && editor) {
            // 提取代码（去除可能的 markdown 格式）
            let code = refactoredCode.trim();
            // 尝试提取代码块中的内容
            const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            }
            
            // 替换选中的代码
            editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, code);
            });
            
            vscode.window.showInformationMessage('代码已重构并应用');
        }
    } catch (error) {
        // 错误已在 generateWithProgress 中处理
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
        
        // 询问用户是否要插入代码
        const shouldInsert = await vscode.window.showQuickPick(
            ['是', '否'],
            { placeHolder: '是否将生成的代码插入到当前光标位置？' }
        );

        if (shouldInsert === '是' && editor) {
            // 提取代码
            let code = generatedCode.trim();
            const codeBlockMatch = code.match(/```[\w]*\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
                code = codeBlockMatch[1];
            }
            
            // 插入代码
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, code);
            });
            
            vscode.window.showInformationMessage('代码已插入');
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
 * 插件停用时的清理工作
 */
export function deactivate() {
    outputChannel?.dispose();
}

