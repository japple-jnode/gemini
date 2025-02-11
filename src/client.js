/*
JustGemini/client.js
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//load jnode packages
const request = require('@jnode/request');

//load classes and functions
const GeminiFileManager = require('./file.js');
const GeminiModel = require('./model.js');

//error types
//errors from Gemini API
class GeminiAPIError extends Error {
	constructor(code, body, headers) {
		super(`Gemini API respond with code ${code}.`);
		this.code = code;
		this.body = body;
		this.headers = headers;
	}
}

//Gemini api client
class GeminiClient {
	constructor(key, options = {}) {
		this.key = key; //api key
		
		//client api options
		this.apiBase = options.apiBase ?? 'generativelanguage.googleapis.com';
		this.apiThrowError = options.apiThrowError ?? true; //throw error when api status code is not 2xx
		this.fileUnsupportError = options.fileUnsupportError ?? true; //throw error when file format is not supported
		
		//file manager
		this.fileManager = new GeminiFileManager(this);
		
		//file manager options
		this.fileActiveCheckDelay = options.fileActiveCheckDelay ?? 1500;
		this.fileMaxActiveCheck = options.fileMaxActiveCheck ?? 15;
	}
	
	//get full api url with base, path and key
	apiUrl(path = '/', query = '') {
		return `https://${this.apiBase}${path}?key=${this.key}${(query ? `&${query}` : '')}`;
	}
	
	//make an request to Gemini API
	async apiRequest(method = 'GET', path = '/', query = '', body) {
		const res = await request.request(method, this.apiUrl(path), {
			'Content-Type': (body !== undefined) ? 'application/json' : null
		}, (body !== undefined) ? JSON.stringify(body) : undefined); //make an request
		
		if (((res.statusCode > 299) || (res.statusCode < 200)) && this.apiThrowError) { //throw error if not 2xx
			throw new GeminiAPIError(res.statusCode, res.json() ?? res.text(), res.headers);
		}
		
		return res;
	}
	
	//get model (GeminiModel)
	model(model, options) {
		return new GeminiModel(this, model, options);
	}
}

module.exports = GeminiClient;