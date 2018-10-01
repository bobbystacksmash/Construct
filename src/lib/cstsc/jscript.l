%x MLC CCON CCCMT CCIF CCELIF DQS SQS


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

VarWin32                   "@_win32"
VarWin16                   "@_win16"
VarMac                     "@_mac"
VarAlpha                   "@_alpha"
VarX86                     "@_x86"
Var680                     "@_mc680x0"
VarPPC                     "@_PowerPC"
VarJScript                 "@_jscript"
VarJScriptBuild            "@_jscript_build"
VarJScriptVersion          "@_jscript_version"

CCCommentBegin             "/*@"
CCCommentEnd               "@*/"
CCCommentBeginIf           \/\*"@if"\s*\(
CCCommentBeginCCOn         \/\*"@cc_on"
CCOn                       "@cc_on"
CCIf                       "@if"\s*\(
CCElIf                     "@elif"\s*\(
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
<INITIAL,CCCMT>{CCIf}              { this.begin("CCON"); this.begin("CCIF"); yy.depth = 1; return token(this, "CC_IF_OPEN"); }
<CCON>{CCElIf}                     { this.begin("CCELIF"); yy.depth = 1; return token(this, "CC_ELIF_OPEN"); }
<CCON>{CCCommentBeginIf}           { this.begin("CCIF"); yy.depth = 1; return token(this, "CC_CMNT_IF_OPEN"); }

<CCIF>{LParen}                     { yy.depth++; }
<CCIF>{RParen}                     { yy.depth--; if (yy.depth === 0) { this.popState(); return token(this, "CC_IF_CLOSE"); } }

<CCELIF>{LParen}                   { yy.depth++; }
<CCELIF>{RParen}                   { yy.depth--; if (yy.depth === 0) { this.popState(); return token(this, "CC_ELIF_CLOSE"); } }


<CCON>{CCEndIf}                    { return token(this, "CC_ENDIF"); }
<CCON>{CCElse}                     { return token(this, "CC_ELSE"); }
<INITIAL>{BooleanTrue}             { /* Ignore */ }
<INITIAL>{BooleanFalse}            { /* Ignore */ }

//
// Variables
//
<INITIAL,CCON,CCIF,CCELIF>{VarWin32}                   { return token(this, "CC_VAR_WIN32");           }
<INITIAL,CCON,CCIF,CCELIF>{VarWin16}                   { return token(this, "CC_VAR_WIN16");           }
<INITIAL,CCON,CCIF,CCELIF>{VarMac}                     { return token(this, "CC_VAR_MAC");             }
<INITIAL,CCON,CCIF,CCELIF>{VarAlpha}                   { return token(this, "CC_VAR_ALPHA");           }
<INITIAL,CCON,CCIF,CCELIF>{VarX86}                     { return token(this, "CC_VAR_X86");             }
<INITIAL,CCON,CCIF,CCELIF>{Var680}                     { return token(this, "CC_VAR_680");             }
<INITIAL,CCON,CCIF,CCELIF>{VarPPC}                     { return token(this, "CC_VAR_PPC");             }
<INITIAL,CCON,CCIF,CCELIF>{VarJScript}                 { return token(this, "CC_VAR_JSCRIPT");         }
<INITIAL,CCON,CCIF,CCELIF>{VarJScriptBuild}            { return token(this, "CC_VAR_JSCRIPT_BUILD");   }
<INITIAL,CCON,CCIF,CCELIF>{VarJScriptVersion}          { return token(this, "CC_VAR_JSCRIPT_VERSION"); }


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
