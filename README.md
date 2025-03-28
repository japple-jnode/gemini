# JustGemini

Simple Gemini API package for Node.js.

```shell
npm install @jnode/gemini
```

## Basic Usage

### Import JustGemini
```js
const gemini = require('@jnode/gemini');
```

### Create a Client
```js
const client = new gemini.Client('YOUR_API_KEY');
```

### Generate Content with a Model
```js
const model = client.model('gemini-pro');

async function generateText() {
  const result = await model.generate('Hello');
  console.log(result.text);
}

generateText();
```

## Class: `GeminiClient`

The main class for interacting with the Gemini API.

### Constructor
```js
new gemini.Client(key, options = {})
```
- `key`: Your Gemini API key.
- `options`: An optional object for setting various client options:
  - `apiBase`: The base URL of the Gemini API. Default is `generativelanguage.googleapis.com`.
  - `apiThrowError`: Whether to throw errors when the API status code is not 2xx. Default is `true`.
  - `fileUnsupportError`: Whether to throw errors when the file type is not supported. Default is `true`.
  - `fileActiveCheckDelay`: Delay in milliseconds between file status checks. Default is `1500`.
  - `fileMaxActiveCheck`: Maximum number of file status checks. Default is `15`.

### Methods

- `apiUrl(path = '/', query = '')`: Returns the full API URL with the base, path, and API key.
    - `path`: API endpoint path.
    - `query`: Query string.
    - **Returns**: `string` - The full API URL.

- `async apiRequest(method = 'GET', path = '/', query = '', body)`: Makes an HTTP request to the Gemini API.
    - `method`: HTTP method (e.g., `GET`, `POST`, `PUT`, `DELETE`). Default is `GET`.
    - `path`: API endpoint path. Default is `/`.
    - `query`: Query string.
    - `body`: Request body data (will be stringified).
    - **Returns**: `Promise<RequestResponse>` - A promise that resolves to a `RequestResponse` object.

- `model(model, options)`: Returns a `GeminiModel` instance for interacting with a specific model.
    - `model`: The name of the model (e.g., `gemini-pro`).
    - `options`: Model options.
    - **Returns**: `GeminiModel` - A `GeminiModel` instance.

- `fileManager`: An instance of `GeminiFileManager` for managing files.

## Class: `GeminiModel`

Represents a specific Gemini model.

### Constructor

```js
new gemini.Model(client, model, options = {})
```

- `client`: A `GeminiClient` instance.
- `model`: The name of the model.
- `options`: An optional object for setting model options:
  - `tools`: Custom tools to be used by the model.
  - `functions`: An array of `GeminiFunction` instances.
  - `functionMode`: Function calling mode ('NONE', 'AUTO', 'ANY').
  - `allowedFunctions`: Allowed function names for function calling.
  - `safetySettings`: Safety settings for the model.
  - `systemInstruction`: System instruction text.
  - `jsonMode`: Enable JSON mode (boolean or object with response schema).
  - `jsonMode`: Enable image generate (boolean).
  - `stopSequences`: Stop sequences for generation.
  - `candidateCount`: Number of candidate responses.
  - `maxOutputTokens`: Maximum number of output tokens.
  - `temperature`: Temperature for generation.
  - `topP`: Top-p value for generation.
  - `topK`: Top-k value for generation.

### Methods

- `optionsToApiFormat(options = {})`: Converts simple options to API format.
    - `options`: Model options.
    - **Returns**: `object` - Options in API format.

- `async contentToApiFormat(content)`: Converts simple content to API format.
    - `content`: Content string, array, or object.
    - **Returns**: `Promise<array>` - Content in API format.

- `apiRequest(method, action, body)`: Makes an API request for this model.
    - `method`: HTTP method.
    - `action`: API action.
    - `body`: Request body.
    - **Returns**: `Promise<RequestResponse>` - A promise that resolves to a `RequestResponse` object.

- `generate(content, optionsOverwrite = {})`: Generates content using the model.
    - `content`: Input content, which can be one of the following formats:
        - **String**: A single-turn text input.
            - **Example**: `'What is the meaning of life?'`
        - **Array of strings**: A multi-turn conversation where each string represents a turn. The turns alternate between user and model.
            - **Example**: `['What is the capital of France?', 'Paris.', 'And what about Spain?']`
        - **Array of arrays/objects**: A multi-turn conversation with more complex inputs, including text, booleans (to set the role), and file data.
          -  **String**: a text part.
          -  **Boolean**: (Optional, default `true` which means is a "user" turn) set role to "user" (`true`) or "model" (`false`).
          -  **Object**: can be one of the following:
              - `{ text: string }`: A text part.
                  - **Example**: `{ text: 'What is the weather like today?' }`
              - `{ filePath: string }`: A local file to be uploaded and used as input. The file will be automatically uploaded if it hasn't been uploaded already.
                  - **Example**: `{ filePath: './image.png' }`
              - `{ fileUrl: string }`: A web file URL to be used as input. The file will be automatically uploaded if it hasn't been uploaded already.
                  - **Example**: `{ fileUrl: 'https://example.com/image.jpg' }`
              - `{ file: { mimeType: string, data: Buffer } }`: File data directly provided as input.
                  - **Example**: `{ file: { mimeType: 'image/png', data: imageBuffer } }`
              - Other objects will be treated as original API part format.
            - **Example**: `[['What is in this image?', true, { filePath: './image.png' }], false, 'This is a picture of a cat.', ['And this one?', { filePath: './image2.jpg' }]]`
        - **Array of objects**: A multi-turn conversation in the original API content format. Each object should have `role` and `parts` properties.
          - **Example**: `[{ role: 'user', parts: [{ text: 'Hello' }] }, { role: 'model', parts: [{ text: 'Hi there!' }] }]`
    - `optionsOverwrite`: Optional options to overwrite model options.
    - **Returns**: `Promise<GeminiContents>` - A promise that resolves to a `GeminiContents` instance.

## Class: `GeminiContents`

Represents the contents generated by a model.

### Constructor

```js
new gemini.Contents(model, contents)
```

- `model`: A `GeminiModel` instance.
- `contents`: Initial contents array.

### Methods

- `async generate(content, optionsOverwrite)`: Generates content and updates the `GeminiContents` instance.
    - `content`: Input content.
    - `optionsOverwrite`: Optional options to overwrite model options.
    - **Returns**: `Promise<this>` - The updated `GeminiContents` instance.

- `async runFunctions(extraData)`: Executes function calls and continues generation.
    - `extraData`: Extra data to be passed to functions.
    - **Returns**: `Promise<GeminiContents>` - A promise that resolves to a new `GeminiContents` instance with the function responses.

### Properties

- `model`: The `GeminiModel` instance.
- `contents`: The full contents array.
- `text`: The generated text.
- `functionCalls`: An array of function calls.
- `usage`: Usage metadata.
- `feedback`: Prompt feedback.
- `status`: Finish reason.
- `attachments`: An array of inline data respond by model.

## Class: `GeminiFileManager`

Manages file uploads and retrieval for the Gemini API.

### Constructor

```js
new gemini.FileManager(client)
```

- `client`: A `GeminiClient` instance.

### Methods

- `async uploadFile(file, isWebFile = false, displayName)`: Uploads a local or web file to Gemini API.
    - `file`: File path or URL.
    - `isWebFile`: Whether the file is a web file. Default is `false`.
    - `displayName`: Optional display name for the file.
    - **Returns**: `Promise<object>` - A promise that resolves to the uploaded file object.

- `async getFilesList()`: Retrieves the list of uploaded files.
    - **Returns**: `Promise<array>` - A promise that resolves to an array of file objects.

- `apiDeleteFile(file)`: Deletes an uploaded file.
    - `file`: File name or object.
    - **Returns**: `Promise<RequestResponse>` - A promise that resolves to a `RequestResponse` object.

- `async getSmartFile(file, isWebFile = false)`: Retrieves a file object if it's already uploaded, otherwise returns `undefined`.
    - `file`: File path or URL.
    - `isWebFile`: Whether the file is a web file.
    - **Returns**: `Promise<object|undefined>` - A promise that resolves to the file object or `undefined`.

- `getSmartName(file, isWebFile, mtime)`: Generates a smart display name for a file.
    - `file`: File path or URL.
    - `isWebFile`: Whether the file is a web file.
    - `mtime`: File modification time.
    - **Returns**: `string` - The smart display name.

### Properties

- `client`: The `GeminiClient` instance.
- `filesCache`: An array of cached file objects.

## Class: `GeminiFunction`

Represents a function that can be called by the Gemini model.

### Constructor

```js
new gemini.Function(name, description, parameters = null, func)
```

- `name`: Function name.
- `description`: Function description.
- `parameters`: Function parameters (in OpenAPI format).
- `func`: The actual function to be executed.

### Methods

- `toApiFormat()`: Converts the `GeminiFunction` instance to API format.
    - **Returns**: `object` - Function in API format.

## Class: `GeminiAPIError`

An error that is thrown when the Gemini API returns a non-2xx status code.

### Constructor
```js
new GeminiAPIError(code, body, headers)
```
- `code`: The error code.
- `body`: The response body.
- `headers`: The response headers.

### Properties

- `message`: The error message.
- `code`: The error code.
- `body`: The response body.
- `headers`: The response headers.

## Helper functions

- `RequestResponse` class with properties like:
    - `code`: Status code.
    - `headers`: Response headers.
    - `text(encoding)`: Return response body in string, with optional encoding. Example: `res.text('utf-8')`.
    - `json()`: Return response body in JSON format, or `undefined` when cannot parse JSON. Example: `res.json()`.

## Constants

- `supportMimeTypes`: An object mapping file extensions to MIME types.
