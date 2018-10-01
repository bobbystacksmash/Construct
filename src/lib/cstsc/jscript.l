%x MLC CCON CCCMT CCIF DQS SQS


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

CCCommentBegin             "/*@"
CCCommentEnd               "@*/"
CCCommentBeginIf           \/\*"@if"\s*\(
CCCommentBeginCCOn         \/\*"@cc_on"\s
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
// CC
//
<INITIAL>{CCOn}                    { this.begin("CCON"); return token(this, "CC_ON"); }
<INITIAL,CCON>{CCCommentBeginCCOn} { this.begin("CCON"); this.begin("CCCMT"); return token(this, "CC_CMNT_CC_ON"); }
<CCON,CCCMT>{CCCommentEnd}         { this.popState(); return token(this, "CC_CMNT_END"); }
<INITIAL>{CCIf}                    { this.begin("CCON"); this.begin("CCIF"); yy.depth = 1; return token(this, "CC_IF_OPEN"); }
<CCON>{CCCommentBeginIf}           { this.begin("CCIF"); yy.depth = 1; return token(this, "CC_CMNT_IF_OPEN"); }


<CCIF>{LParen}                     { yy.depth++; }
<CCIF>{RParen}                     { yy.depth--; if (yy.depth === 0) { this.popState(); return token(this, "CC_IF_CLOSE"); } }


<CCON>{CCEndIf}                    { return token(this, "CC_ENDIF"); }
<CCON>{CCElse}                     { return token(this, "CC_ELSE"); }
<INITIAL>{BooleanTrue}             { /* Ignore */ }
<INITIAL>{BooleanFalse}          { /* Ignore */ }


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
