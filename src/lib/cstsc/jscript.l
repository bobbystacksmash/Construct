%x MLC CCON CCIF DQS


%{

var paren_counter = 0;

function token (state, name) {
            let obj = {
            name: name,
            line: yylineno,
            text: yytext,
            len:  yyleng,
                    loc:  yylloc
                };
    return obj;
}
%}

Whitespace                 [ \t]
NewLine                    [\r\n]
Unknown                    .

MultiLineCommentBegin      \/\*[^@]
MultiLineCommentEnd        [^@]\*\/
SingleLineComment          "//".*

DoubleQuote                \"

LParen                     "("
RParen                     ")"

BooleanTrue                "true"
BooleanFalse               "false"

CCCommentBegin             \/\*\@
CCCommentEnd               \@\*\/
CCOn                       "@cc_on"
CCIf                       "@if"\s*\(
CCElse                     "@else"
CCEndIf                    "@end"
Ignore                     .

%%

//
// Strings
//
<INITIAL>{DoubleQuote}           { this.begin("DQS"); }
<DQS>[^\\]{DoubleQuote}          { this.popState(); }
<DQS>{Ignore}                    { /* Ignore */ }

//
// CC Literals
//
<INITIAL>{CCOn}                        { return token(this, "CC_ON"); }

<INITIAL>{CCIf}                        { this.begin("CCIF"); paren_counter++; return token(this, "CC_IF_OPEN"); }
<CCIF>{LParen}                         { paren_counter++; }
<CCIF>{RParen}                         { if (paren_counter-- === 0) { this.popState(); return token(this, "CC_IF_CLOSE"); } }


<INITIAL>{CCEndIf}                     { return token(this, "CC_ENDIF"); }
<INITIAL>{CCElse}                      { return token(this, "CC_ELSE"); }
<INITIAL>{BooleanTrue}                 { /* Ignore */ }
<INITIAL>{BooleanFalse}                { /* Ignore */ }


//
// Comments
//
<INITIAL,CCON>{SingleLineComment}           { /* Ignore single-line comments */ }
<INITIAL,CCON>{MultiLineCommentBegin}       { this.begin("MLC"); return "MLINEC"}
<MLC>{MultiLineCommentEnd}             { this.popState();   }
<MLC>{Ignore}+                         { /* Ignore */ }

<*>{Whitespace}+          { /* Ignore whitespace */ }
<*>{NewLine}              { /* Ignore newlines   */ }
<*>{Unknown}              { return; return "??>" + this.matched ; /* Ignore  unknown   */ }
<*><<EOF>>                { return "EOF";           }

%%
