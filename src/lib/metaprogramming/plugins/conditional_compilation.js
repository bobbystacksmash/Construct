const fs = require("fs");

const CODE_1 = `
  /*@cc_on @*/
  /*@if (@_jscript_version >= 4)
     alert("JScript version 4 or better");
   @else @*/
  alert("You need a more recent script engine.");
  /*@end @*/`;

function scanner (sloc) {

    var cc_blocks  = [],
        cc_started = false,
        cc_start   = null,
        cc_end     = null;

    for (let i = 0; i < sloc.length; i++) {
        const line  = sloc[i];
        let match = null;

        if (!cc_started && (match = /@cc_on/g.exec(line))) {
            cc_started = true;
            cc_start = {
                token: "CC_START",
                value: match[0],
                line: i,
                column: {
                    start: match.index,
                    finish: match.index + match[0].length
                }
            };
        }
        else if (cc_started && (match = /@end/.exec(line))) {
            cc_started = false;
            cc_end = {
                token: "CC_END",
                value: match[0],
                line: i,
                column: {
                    start: match.index,
                    finish: match.index + match[0].length
                }
            };

            cc_blocks.push({
                start:  cc_start,
                finish: cc_end
            });
        }
    }

    return cc_blocks;
}

function extractor (sloc, cc_block_locations) {

    cc_block_locations.forEach(cc_block => {

        const begin = cc_block.start,
              end   = cc_block.finish,
              block = sloc.slice(begin.line, end.line);

    });
}


//const file_contents = fs.readFileSync(process.argv[2]).toString();
const file_contents = CODE_1;
const sloc = file_contents.split(/\r?\n/);

const cc_block_locations = scanner(sloc),
      cc_blocks          = extractor(sloc, cc_block_locations);



// Step 1: Find the beginning (@cc_on) and end (@end) of the CC.
// Step 2: Delete all comments NOT starting with '/*@'
// Step 3: Remove all remaining '/*' and '*/' comments.
// Step 4: Begin replacing the parts which are left, one component at a time:
//
//   @if   => if
//   @else => else
//   @end  => (nothing)
//
