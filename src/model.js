/*
JustGemini/model.js
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//load classes and functions
const GeminiContents = require('./contents.js');

//Gemini model
class GeminiModel {
	constructor(client, model, options = {}) {
		this.client = client;
		this.model = model;
		this.options = options;
	}
	
	//change simple options to api format
	optionsToApiFormat(options = {}) {
		let result = {};
		
		//tools
		if (options.tools) { //use code excution or something
			result.tools = options.tools;
		} else if (options.functions) { //use GeminiFunction
			result.tools = [{ functionDeclarations: options.functions.map((i) => i.toApiFormat()) }];
		}
		
		//tool config
		if (options.functionMode || options.allowedFunctions) result.toolConfig = {
			functionCallingConfig: {
				mode: options.functionMode,
				allowedFunctionNames: options.allowedFunctions
			}
		};
		
		//safety settings
		if (options.safetySettings) {
			result.safetySettings = [];
			for (let i in options.safetySettings) {
				result.safetySettings.push({
					category: i,
					threshold: options.safetySettings[i]
				});
			}
		}
		
		//system instruction
		if (options.systemInstruction) result.systemInstruction = { parts: [{ text: options.systemInstruction }] };
		
		//generation config
		result.generationConfig = {};
		
		//json mode
		if (options.jsonMode === true) { //without response schema
			result.generationConfig.responseMimeType = 'application/json';
		} else if ((typeof options.jsonMode) === 'object') { //with response schema
			result.generationConfig.responseMimeType = 'application/json';
			result.generationConfig.responseSchema = options.jsonMode;
		}
		
		//image generate
		if (options.imageGenerate === true) {
			result.generationConfig.responseModalities = [ 'image', 'text' ];
		}
		
		//other options
		if (options.stopSequences) result.generationConfig.stopSequences = options.stopSequences;
		if (options.candidateCount) result.generationConfig.candidateCount = options.candidateCount;
		if (options.maxOutputTokens) result.generationConfig.maxOutputTokens = options.maxOutputTokens;
		if (options.temperature) result.generationConfig.temperature = options.temperature;
		if (options.topP) result.generationConfig.topP = options.topP;
		if (options.topK) result.generationConfig.topK = options.topK;
		
		//any options
		Object.assign(result.generationConfig, options.generationConfig ?? {});
		
		return result;
	}
	
	//change simple content(s) to api format
	async contentToApiFormat(content, keyOverwrite) {
		let result = [];
		let isUser = true;
		
		if (typeof content === 'string') { //single round text chat
			result.push({ role: isUser ? 'user' : 'model', parts: [{ text: content }] });
		} else if (Array.isArray(content)) { //multiple rounds
			for (let i of content) {
				if (typeof i === 'string') { //text
					result.push({ role: isUser ? 'user' : 'model', parts: [{ text: i }] });
				} else if (Array.isArray(i)) { //multiple parts
					let parts = [];
					
					for (let j of i) {
						if (typeof j === 'string') { //text
							if (j.trim().length === 0) continue; //ignore empty string
							parts.push({ text: j });
						} else if (typeof j === 'boolean') { //boolean, set role
							isUser = j;
						} else if (typeof j === 'object') { //text or file
							if (j.text) { //text
								parts.push({ text: j });
							} else if (j.filePath) { //local file
								let file;
								
								try {
									file = await this.client.fileManager.getSmartFile(j.filePath, false, keyOverwrite); //check file is uploaded
									if (!file) { //if not, upload file
										file = await this.client.fileManager.uploadFile(j.filePath, false, keyOverwrite);
									}
								} catch (err) { //when file is unsupport
									if (this.client.fileUnsupportError) throw err;
									continue;
								}
								
								parts.push({ fileData: { fileUri: file.uri } }); //push file
							} else if (j.fileUrl) { //web files
								let file;
								
								try {
									file = await this.client.fileManager.getSmartFile(j.fileUrl, true, keyOverwrite); //check file is uploaded
									if (!file) { //if not, upload file
										file = await this.client.fileManager.uploadFile(j.fileUrl, true, keyOverwrite);
									}
								} catch (err) { //when file is unsupport
									if (this.client.fileUnsupportError) throw err;
									continue;
								}
								
								parts.push({ fileData: { fileUri: file.uri } }); //push file
							} else if (j.file) { //file data
								parts.push({
									inlineData: {
										mimeType: j.file.mimeType,
										data: Buffer.from(j.file.data).toString('base64')
									}
								});
							} else { //orginal api part format
								parts.push(j);
							}
						}
					}
					
					//ignore empty content
					if (parts.length === 0) continue;
					
					const role = isUser ? 'user' : 'model';
					let lastItem = result[result.length - 1];
					if (lastItem && ((lastItem.role === role) || ((lastItem.role === 'function') && isUser))) { //if same role, push to single content
						result[result.length - 1] = { ...lastItem };
						result[result.length - 1].parts = [ ...(result[result.length - 1].parts), ...parts ];
					} else { //new content
						result.push({ role, parts });
					}
				} else if (typeof i === 'object') { //orginal api content format
					result.push(i);
					isUser = i.role !== 'model';
				}
				isUser = !isUser;
			}
		}
		
		return result;
	}
	
	//make an request to Gemini API with this model
	apiRequest(method, action, body, keyOverwrite) {
		return this.client.apiRequest(method, `/v1beta/models/${this.model}${(action ? `:${action}` : '')}`, null, body, keyOverwrite);
	}
	
	//generate content with simple format and simple output
	generate(content, optionsOverwrite = {}, keyOverwrite) {
		return (new GeminiContents(this)).generate(content, optionsOverwrite, keyOverwrite);
	}
}

module.exports = GeminiModel;