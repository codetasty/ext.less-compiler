# LESS Compiler

less-compiler is an extension for the code editor CodeTasty that adds automatic compilation of LESS files upon saving.

## Configuration
There are 2 methods to configure the extension.

### 1, Configuration file
Create or edit **codetasty.json** file in workspace root.

```
{
    "extension": {
        "less-compiler": {
            "files": {
                "watch": [
                    "less/*.less"
                ]
                "source": "less/app.less",
                "output": "build/app.css"
            }
        }
    }
}
```

#### files
Type: `Array|Object`

Can be also array to compile multiple files.

#### files.watch
Type: `Array`, Required

List of files to watch. Can include asterisk (*) to match any file name.

#### files.source
Type: `String`, Required

Source file that should be compiled.

#### files.output
Type: `String`, Required

Destination where the compiled output is saved.

#### files.compress
Type: `Bool`, Default: `true`

Type: `String`

#### files.plugin
Type: `String|Array`

Injects plugin, must be installed (e.g. "css-autoprefixer").

### 2, Inline comment

Compile options can be set in the first line of the edited file, separated by comma.

    // out: ../css/style.css, compress: true

#### out
Type: `String`, Required

Sets output file.

    // out: ., app.css, ../style.css
    // . - same path with css extension
    // something.less - will compile this file instead

#### compress
Type: `Bool`, Default: `true`

Toggles if file should be compressed.

    // compress: false

#### plugin
Type: `String`, Default: `null`
Injects plugin, must be installed.

    // plugin: css-autoprefixer