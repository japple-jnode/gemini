/*
JustGemini/file.js
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//load nodejs packages
const http = require('http');
const https = require('https');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

//load jnode packages
const request = require('@jnode/request');

//load supported mime type
const supportMimeTypes = require('./mime.json');
const mimeTypesArray = Object.values(supportMimeTypes);

//Gemini file manager
class GeminiFileManager {
	constructor(client) {
		this.client = client;
		this.filesCache = [];
	}
	
	//upload local file or web file to gemini api with smart handling
	uploadFile(file, isWebFile = false, displayName) {
		return new Promise(async (resolve, reject) => {
			let fileSize; //file bytes
			let fileType = 'text/plain'; //file mime type
			let fileMtime = 0; //file modify time
			let fileStream; //file read stream
			
			//get file info and read stream
			if (isWebFile) { //handle files from internet (http/https)
				const web = file.startsWith('https://') ? https : http; //select from http or https
				await new Promise((resolve, reject) => {
					web.get(file, (res) => { //fetch file
						if (res.statusCode > 299 || res.statusCode < 200) { //check http error
							let err = new Error(`Web file responded with code ${res.statusCode}.`);
							err.headers = res.headers; //provide headers
							res.destroy(); //destory connect
							reject(err); //throw error
							return;
						};
						
						//check unsupport file type and throw error
						if (!mimeTypesArray.includes(res.headers['content-type'] ?? 'text/plain')) {
							reject(new Error(`Unsupported file MIME type: ${fileType}.`));
							return;
						}
						
						//set file info and read stream
						fileType = res.headers['content-type'] ?? 'text/plain';
						fileSize = res.headers['content-length'] ?? null;
						fileMtime = new Date(res.headers['last-modified'] ?? 0).getTime();
						fileStream = res;
						
						resolve();
					});
				});
			} else { //handle local file
				file = path.resolve(file); //resolve path
				
				let fileStat;
				try {
					fileStat = await fs.promises.stat(file); //get file info
				} catch (err) {
					reject(new Error(`Fail to read file "${file}".`)); //could not get file
				}
				
				//check unsupport file type and throw error
				if (!mimeTypesArray.includes(supportMimeTypes[path.extname(file)] ?? 'text/plain')) {
					reject(new Error(`Unsupported file MIME type: ${fileType}.`));
					return;
				}
				
				//set file info and read stream
				fileType = supportMimeTypes[path.extname(file)] ?? 'text/plain';
				fileSize = fileStat.size ?? null;
				fileMtime = fileStat.mtimeMs ?? 0;
				fileStream = fs.createReadStream(file);
			}
			
			//set smart display name
			displayName = displayName ?? this.getSmartName(file, isWebFile, fileMtime);
			
			//make a multipart request
			const res = await request.multipartRequest('POST', this.client.apiUrl('/upload/v1beta/files'), {
				'X-Goog-Upload-Protocol': 'multipart',
				'X-Goog-Upload-Header-Content-Length': fileSize,
				'X-Goog-Upload-Header-Content-Type': fileType
			}, [
				{
					type: 'application/json; charset=utf-8',
					data: JSON.stringify({ file: { displayName: displayName} })
				},
				{
					type: fileType,
					stream: fileStream
				}
			]);
			
			if (res.statusCode !== 200) { //api responded with error
				let err = new Error(`Gemini API responded with code ${res.statusCode}.`);
				err.headers = res.headers; //provide headers
				err.body = res.body; //provide body
				reject(err);
				return;
			}
			
			let result = res.json().file;
			
			for (let i = 0; (i < this.client.fileMaxActiveCheck && result.state !== 'ACTIVE'); i++) { //check file status until is active
				result = (await this.client.apiRequest('GET', `/v1beta/${result.name}`)).json();
				await new Promise((resolve) => {
					setTimeout(resolve, this.client.fileActiveCheckDelay);
				});
			}
			
			resolve(result); //return result
		});
	}
	
	async getFilesList() {
		this.filesCache = (await this.client.apiRequest('GET', '/v1beta/files', 'pageSize=100')).json().files ?? [];
		return this.filesCache;
	}
	
	apiDeleteFile(file) {
		return this.client.apiRequest('DELETE', `/v1beta/${file}`);
	}
	
	async getSmartFile(file, isWebFile = false) {
		let fileMtime = 0; //file modify time
		
		if (isWebFile) { //handle files from internet (http/https)
			const web = file.startsWith('https://') ? https : http; //select from http or https
			await new Promise((resolve, reject) => {
				web.get(file, (res) => { //fetch file
					if (res.statusCode > 299 || res.statusCode < 200) { //check http error
						let err = new Error(`Web file responded with code ${res.statusCode}.`);
						err.headers = res.headers; //provide headers
						res.destroy(); //destory connect
						reject(err); //throw error
						return;
					};
					
					res.destroy(); //destory connect
					
					//set file info and read stream
					fileMtime = new Date(res.headers['last-modified'] ?? 0).getTime();
					
					resolve();
				});
			});
		} else { //handle local file
			file = path.resolve(file); //resolve path
			
			let fileStat;
			try {
				fileStat = await fs.promises.stat(file); //get file info
			} catch (err) {
				throw new Error(`Fail to read file "${file}".`); //could not get file
			}
			
			//set file mtime
			fileMtime = fileStat.mtimeMs ?? 0;
		}
		
		const displayName = this.getSmartName(file, isWebFile, fileMtime);
		await this.getFilesList(); //update files list
		return this.filesCache.find((e) => e.displayName === displayName);
	}
	
	getSmartName(file, isWebFile, mtime) {
		const hashSum = crypto.createHash('sha256');
		hashSum.update(path.resolve(file)); //hash file path/url
		
		//format: <HEX HASH> <IS WEB FILE> <MTIME>
		return hashSum.digest('hex') + ' ' + (isWebFile ? '1' : '0') + ' ' + mtime;
	}
}

module.exports = GeminiFileManager;