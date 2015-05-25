# less-compiler

less-compiler is an extension for the code editor CodeTasty that adds automatic compilation of LESS files upon saving.


### Compile Options

LESS compile options can be set in the first line of the edited file:

    // out: ../css/style.css, compress: true

out: compiled file destination
    values: ., app.css, ../style.css
    . - same path with css extension
	
compress: compress compiled file?
  values: true - default, false

main: adds a master file before compiled file
    values: main.less, ../master.less
