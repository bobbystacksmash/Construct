%x MLC CCON CCIF DQS SQS


%{
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
SingleQuote                "'"

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
<DQS>[^\\]{DoubleQuote}          { this.popState();   }
<DQS>{Ignore}                    { /* Ignore */       }

<INITIAL>{SingleQuote}           { this.begin("SQS"); }
<SQS>[^\\]{SingleQuote}          { this.popState();   }
<SQS>{Ignore}                    { /* Ignore */       }

//
// CC Literals
//
<INITIAL>{CCOn}                  { return token(this, "CC_ON"); }
<INITIAL>{CCIf}                  { this.begin("CCIF"); yy.depth = 1; return token(this, "CC_IF_OPEN"); }
<CCIF>{LParen}                   { yy.depth++; }
<CCIF>{RParen}                   { yy.depth--; if (yy.depth === 0) { this.popState(); return token(this, "CC_IF_CLOSE"); } }


<INITIAL>{CCEndIf}                     { return token(this, "CC_ENDIF"); }
<INITIAL>{CCElse}                      { return token(this, "CC_ELSE"); }
<INITIAL>{BooleanTrue}                 { /* Ignore */ }
<INITIAL>{BooleanFalse}                { /* Ignore */ }


//
// Comments
//
<INITIAL,CCON>{SingleLineComment}           { /* Ignore single-line comments */ }
<INITIAL,CCON>{MultiLineCommentBegin}       { this.begin("MLC"); }
<MLC>{MultiLineCommentEnd}             { this.popState();   }
<MLC>{Ignore}+                         { /* Ignore */ }

<*>{Whitespace}+          { /* Ignore whitespace */ }
<*>{NewLine}              { /* Ignore newlines   */ }
<*>{Unknown}              { return; return "??>" + this.matched ; /* Ignore  unknown   */ }
<*><<EOF>>                { return "EOF";           }

%%
