%x DQS SQS MLC SLC CCON CCMNT CCIF CCIF_TEST CCIF_GROUP

%{
function handle_token(state, name) {
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
SingleLineComment          "//".*[\r\n\u2028\u2029]

LParen                     "("
RParen                     ")"

CCCommentBegin             \/\*\@
CCCommentEnd               \@\*\/
CCIf                       "@if"\s*\(
CCElse                     "@else"
CCEndIf                    "@end"
Ignore                     .

%%

// Double-quoted strings.
<INITIAL,CCON>\"                 { this.begin("DQS"); return handle_token(this, "DoubleQuotedStringBegin"); };
<DQS>[\\]"\""                    ;
<DQS>\"                          { this.popState(); return handle_token(this, 'DoubleQuotedStringEnd'); };
<DQS>.                           ;

<INITIAL>"'"                     { this.begin("SQS"); return handle_token(this, 'OPEN_SQUOTE_STRING'); };
<SQS>[\\]"'"                     ;
<SQS>\'                          { this.popState(); return handle_token(this, 'CLOSE_SQUOTE_STRING'); };
<SQS>.                           ;

<INITIAL>\/\*\@cc_on             { this.begin("CCON"); this.begin("CCMNT"); return handle_token(this, 'OPEN_CC_COMMENT_CC_ON'); }
<INITIAL>\@cc_on                 { this.begin("CCON"); return handle_token(this, 'CC_ON_LITERAL'); }
<CCON>\@cc_on                    ; /* Ignore further @cc_on calls if CC is already on. */


<CCON>{CCIf}                        { this.begin("CCIF"); this.begin("CCIF_TEST"); return "CCIfStatementBegin" }



// ===============
// C O M M E N T S
// ===============
//
//
// Single-Line Comments
//
<INITIAL>[/]{2}                  { this.begin("SLC"); return handle_token(this, 'SingleLineCommentBegin'); }
<SLC>\n                          { this.popState(); return handle_token(this, 'SingleLineCommentEnd'); }
//
// Multi-Line Comments
//
<INITIAL>{MultiLineCommentBegin}       { this.begin("MLC"); return "MultiLineCommentBegin"; }
<MLC>{MultiLineCommentEnd}             { this.popState();   return "MultiLineCommentEnd"; }
<MLC>.                                 { /* Ignore */ }

<INITIAL>{CCIf}                        { this.begin("CCIF"); this.begin("CCIF_TEST"); return "CCIfStatementBegin" }
<CCIF_TEST>{LParen}                    { this.begin("CCIF_GROUP"); }
<CCIF_GROUP>{RParen}                   { this.popState(); }
<CCIF_TEST>{RParen}                    { this.popState(); this.popState(); return "CCIfStatementEnd"; }
<INITIAL>{CCEndIf}                     { return "CCEndIf" }
<INITIAL>{CCElse}                      { return "CCElse"  }

<CCMNT>\/\*\@                    { this.begin("CCMNT");  return handle_token(this, 'OPEN_CC_COMMENT'); }
<CCMNT>\@\*\/                    { this.popState();    return handle_token(this, 'CLOSE_CC_COMMENT'); }

<*><<EOF>>                return "EOF";
<*>{Whitespace}+          ;
<*>{NewLine}+             ;
<*>{Unknown}              ;

%%
