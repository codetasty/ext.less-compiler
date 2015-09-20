# less-compiler

less-compiler is an extension for the code editor CodeTasty that adds automatic compilation of LESS files upon saving.


### Compile Options

LESS compile options can be set in the first line of the edited file:

    // out: ../css/style.css, compress: true

out: compiled file destination

    // out: ., app.css, ../style.css
    // . - same path with css extension
    // something.less - will compile this file instead
	
compress: compress compiled file?

    // compress: true - default, false

underscores: prefix imported files with underscores 

    // underscores: true

plugin: inject plugin (must be installed)

    // plugin: css-autoprefixer

importing files

    @import "variables";