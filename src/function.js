/*
JustGemini/function.js
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//gemini function
class GeminiFunction {
	constructor(name, description, parameters = null, func) {
		this.name = name;
		this.description = description;
		this.parameters = parameters;
		this.func = func; //will excute this function with (parameters, extraData)
	}
	
	toApiFormat() {
		return {
			name: this.name,
			description: this.description,
			parameters: this.parameters
		};
	}
}

module.exports = GeminiFunction;