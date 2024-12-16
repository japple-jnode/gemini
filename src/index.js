/*
JustGemini
v.1.0.0

Simple Gemini API package for Node.js.

by JustNode Dev Team / JustApple
*/

//export classes
module.exports = {
	Client: require('./client.js'),
	FileManager: require('./file.js'),
	Model: require('./model.js'),
	Function: require('./function.js'),
	Contents: require('./contents.js'),
	supportMimeTypes: require('./mime.json')
};