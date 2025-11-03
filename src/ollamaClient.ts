/**
 * Ollama API 客户端
 * 用于与本地 Ollama 服务进行通信
 * 使用原生 fetch API，无需第三方依赖
 */
export class OllamaClient {
    private baseUrl: string;
    private model: string;
    private timeout: number;
    private useThirdParty: boolean;
    private thirdPartyApiUrl: string;
    private thirdPartyApiKey: string;
    private thirdPartyModel: string;

    constructor(baseUrl: string, model: string, timeout: number, useThirdParty: boolean = false, thirdPartyApiUrl: string = '', thirdPartyApiKey: string = '', thirdPartyModel: string = '') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除尾部斜杠
        this.model = model;
        this.timeout = timeout;
        this.useThirdParty = useThirdParty;
        this.thirdPartyApiUrl = thirdPartyApiUrl;
        this.thirdPartyApiKey = thirdPartyApiKey;
        this.thirdPartyModel = thirdPartyModel;
    }

    /**
     * 更新配置
     */
    updateConfig(baseUrl: string, model: string, timeout: number, useThirdParty: boolean = false, thirdPartyApiUrl: string = '', thirdPartyApiKey: string = '', thirdPartyModel: string = '') {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.model = model;
        this.timeout = timeout;
        this.useThirdParty = useThirdParty;
        this.thirdPartyApiUrl = thirdPartyApiUrl;
        this.thirdPartyApiKey = thirdPartyApiKey;
        this.thirdPartyModel = thirdPartyModel;
    }

    /**
     * 发送 HTTP 请求（带超时控制）
     * @param url 请求 URL
     * @param options Fetch 选项
     */
    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`请求超时 (${this.timeout}ms)`);
            }
            throw error;
        }
    }

    /**
     * 检查 Ollama 服务是否可用
     */
    async checkHealth(): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/api/tags`;
            const response = await this.fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * 获取可用的模型列表
     */
    async listModels(): Promise<string[]> {
        try {
            const url = `${this.baseUrl}/api/tags`;
            const response = await this.fetchWithTimeout(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: any = await response.json();
            if (data && data.models) {
                return data.models.map((model: any) => model.name);
            }
            return [];
        } catch (error: any) {
            if (error.message.includes('超时')) {
                throw error;
            } else if (error.message.includes('HTTP')) {
                throw new Error(`获取模型列表失败: ${error.message}`);
            } else {
                throw new Error(`获取模型列表失败: 无法连接到 Ollama 服务 - ${error.message}`);
            }
        }
    }

    /**
     * 向模型发送消息并获取响应
     * @param prompt 提示词
     * @param systemPrompt 系统提示词（可选）
     * @param modelName 使用的模型名称（可选，默认使用配置的模型）
     */
    async generate(
        prompt: string,
        systemPrompt?: string,
        modelName?: string
    ): Promise<string> {
        // 如果使用第三方 API
        if (this.useThirdParty) {
            return await this.callThirdPartyAPI(prompt, systemPrompt, false);
        }

        try {
            const model = modelName || this.model;
            const requestBody: any = {
                model: model,
                prompt: prompt,
                stream: false
            };

            // 如果有系统提示词，添加到请求中
            if (systemPrompt) {
                requestBody.system = systemPrompt;
            }

            const url = `${this.baseUrl}/api/generate`;
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data: any = await response.json();
            
            if (data && data.response) {
                return data.response;
            }
            
            throw new Error('响应格式不正确：缺少 response 字段');
        } catch (error: any) {
            if (error.message.includes('超时')) {
                throw error;
            } else if (error.message.includes('API 请求失败')) {
                throw error;
            } else if (error.message.includes('fetch')) {
                throw new Error('无法连接到 Ollama 服务，请确保 Ollama 正在运行');
            } else {
                throw new Error(`请求失败: ${error.message}`);
            }
        }
    }

    /**
     * 调用第三方 API（如 OpenAI）
     */
    private async callThirdPartyAPI(
        prompt: string,
        systemPrompt?: string,
        stream: boolean = false,
        onChunk?: (chunk: string) => void
    ): Promise<string> {
        if (!this.thirdPartyApiKey) {
            throw new Error('未配置第三方 API Key');
        }

        const model = this.thirdPartyModel;
        const messages: any[] = [];
        
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const requestBody: any = {
            model: model,
            messages: messages
        };

        if (stream) {
            requestBody.stream = true;
        }

        const response = await this.fetchWithTimeout(this.thirdPartyApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.thirdPartyApiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`第三方 API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
        }

        if (stream && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.substring(6);
                            if (data === '[DONE]') {
                                return fullResponse;
                            }
                            try {
                                const json = JSON.parse(data);
                                const content = json.choices?.[0]?.delta?.content || '';
                                if (content && onChunk) {
                                    onChunk(content);
                                    fullResponse += content;
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            return fullResponse;
        } else {
            const data: any = await response.json();
            const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || '';
            return content;
        }
    }

    /**
     * 流式生成（用于实时显示响应）
     * @param prompt 提示词
     * @param onChunk 接收每个响应块的回调函数
     * @param systemPrompt 系统提示词（可选）
     * @param modelName 使用的模型名称（可选）
     */
    async generateStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        systemPrompt?: string,
        modelName?: string
    ): Promise<void> {
        // 如果使用第三方 API
        if (this.useThirdParty) {
            await this.callThirdPartyAPI(prompt, systemPrompt, true, onChunk);
            return;
        }
        try {
            const model = modelName || this.model;
            const requestBody: any = {
                model: model,
                prompt: prompt,
                stream: true
            };

            if (systemPrompt) {
                requestBody.system = systemPrompt;
            }

            const url = `${this.baseUrl}/api/generate`;
            const response = await this.fetchWithTimeout(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorText}`);
            }

            if (!response.body) {
                throw new Error('响应体为空');
            }

            // 使用 ReadableStream 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        break;
                    }

                    // 将接收到的数据解码并添加到缓冲区
                    buffer += decoder.decode(value, { stream: true });
                    
                    // 按行分割处理
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // 保留最后不完整的行

                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const json = JSON.parse(line);
                                if (json.response) {
                                    onChunk(json.response);
                                }
                                if (json.done) {
                                    return; // 完成
                                }
                            } catch (e) {
                                // 忽略 JSON 解析错误，可能是部分数据
                            }
                        }
                    }
                }

                // 处理缓冲区中剩余的数据
                if (buffer.trim()) {
                    try {
                        const json = JSON.parse(buffer);
                        if (json.response) {
                            onChunk(json.response);
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            } finally {
                reader.releaseLock();
            }
        } catch (error: any) {
            if (error.message.includes('超时')) {
                throw error;
            } else if (error.message.includes('API 请求失败')) {
                throw error;
            } else if (error.message.includes('fetch')) {
                throw new Error('无法连接到 Ollama 服务，请确保 Ollama 正在运行');
            } else {
                throw new Error(`请求失败: ${error.message}`);
            }
        }
    }
}

