/*
JustGemini/contents.js
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//response contents
class GeminiContents {
	constructor(model, contents) {
		this.model = model;
		this.contents = [];
	}
	
	//generate content with simple format and simple output
	async generate(content, optionsOverwrite) {
		this.optionsOverwrite = optionsOverwrite ?? this.optionsOverwrite ?? {};
		this.simpleOptions = { ...(this.model.options), ...(this.optionsOverwrite) }; //overwrite and format
		this.options = this.model.optionsToApiFormat(this.simpleOptions); //overwrite and format
		this.contents = this.contents.concat(await this.model.contentToApiFormat(content)); //push contents
		this.options.contents = this.contents;
		
		this.res = await this.model.apiRequest('POST', 'generateContent', this.options); //make an request
		this.candidate = (this.res.json.candidates ?? [{
			content: { parts: [], role: 'model' },
			finishReason: 'EMPTY' //somtimes gemini may provide empty response
		}])[0];
		this.content = this.candidate.content;
		this.contents.push(this.content); //push to full contents
		this.parts = (this.candidate.content ?? { parts: [] }).parts; //message parts
		this.usage = this.res.json.usageMetadata;
		this.feedback = this.res.json.promptFeedback;
		this.status = this.candidate.finishReason;
		
		//handle function call and pure text
		this.text = '';
		this.functionCalls = [];
		for (let i in this.parts) {
			if (this.parts[i].text) { //pure text
				this.text += this.parts[i].text;
			} else if (this.parts[i].functionCall) { //push function call
				this.functionCalls.push({
					name: this.parts[i].functionCall.name,
					args: this.parts[i].functionCall.args,
					function: this.simpleOptions.functions.find(e => e.name === this.parts[i].functionCall.name),
					partIndex: i
				});
			}
		}
		
		return this;
	}
	
	//run functions with extra data and continue generate
	async runFunctions(extraData) {
		this.functionResponseParts = [];
		
		for (let i of (this.functionCalls ?? [])) { //run every function with await
			const functionResponse = await i.function.func(i.args, extraData);
			this.functionResponseParts.push({ //push parts
				functionResponse: {
					name: i.name,
					response: functionResponse
				}
			});
		}
		
		return this.generate([{ role: 'function', parts: this.functionResponseParts }]);
	}
}

module.exports = GeminiContents;