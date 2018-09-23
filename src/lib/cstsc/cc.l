%x CCMNT CCON CCIF CCSET MLC SLC DQS SQS

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

UNKNOWN              .
WHITESPACE           [ \t]
JS_VAR_NAME          \@[A-Za-z0-9_][A-Za-z0-9_]*

%%


// =============
// S T R I N G S
// =============
//
// Double-quoted strings.
<INITIAL,CCON>\"                 { this.begin("DQS"); return handle_token(this, "OPEN_DQUOTE_STRING"); };
<DQS>[\\]"\""                    ;
<DQS>\"                          { this.popState(); return handle_token(this, 'CLOSE_DQUOTE_STRING'); };
<DQS>.                           ;
//
// Single-quoted strings.
//
<INITIAL>"'"                     { this.begin("SQS"); return handle_token(this, 'OPEN_SQUOTE_STRING'); };
<SQS>[\\]"'"                     ;
<SQS>\'                          { this.popState(); return handle_token(this, 'CLOSE_SQUOTE_STRING'); };
<SQS>.                           ;

// ===========
// CC Specific
// ===========
//
<INITIAL>\/\*\@cc_on             { this.begin("CCON"); this.begin("CCMNT"); return handle_token(this, 'OPEN_CC_COMMENT_CC_ON'); }
<INITIAL>\@cc_on                 { this.begin("CCON"); return handle_token(this, 'CC_ON_LITERAL'); }
<CCON>\@cc_on                    ; /* Ignore further @cc_on calls if CC is already on. */

// Conditionals
<CCON,CCMNT>\/\*\@if             { this.begin("CCMNT"); this.begin("CCIF"); return handle_token(this, 'OPEN_COMMENT_CC_IF'); }
<INITIAL,CCON>@if                { this.begin("CCON"); this.begin("CCIF"); return handle_token(this, 'BEGIN_CC_IF'); }


<INITIAL,CCON,CCMNT>\@if         { this.begin("CCIF"); return handle_token(this, 'BEGIN_CC_IF'); }
<CCIF>\@else                     { return handle_token(this, 'BEGIN_CC_IF_ELSE'); }
<CCIF>\@end                      { this.popState(); return handle_token(this, 'CLOSE_CC_IF'); }

<CCMNT>\/\*\@                    { this.begin("CCMNT");  return handle_token(this, 'OPEN_CC_COMMENT'); }
<CCMNT>\@\*\/                    { this.popState();    return handle_token(this, 'CLOSE_CC_COMMENT'); }

<INITIAL,CCON,CCMNT>\@set        { this.begin("CCSET"); return handle_token(this, 'OPEN_CC_SET'); }
<CCSET>{JS_VAR_NAME}             { this.popState(); return handle_token(this, 'CC_VAR_NAME'); }
//
// Predefined Variables
//
<CCON,CCMNT>"@_win32"            return handle_token(this, 'CC_PREDEF_VAR_WIN32');
<CCON,CCMNT>"@_win16"            return handle_token(this, 'CC_PREDEF_VAR_WIN16');
<CCON,CCMNT>"@_mac"              return handle_token(this, 'CC_PREDEF_VAR_MAC');
<CCON,CCMNT>"@_alpha"            return handle_token(this, 'CC_PREDEF_VAR_ALPHA');
<CCON,CCMNT>"@_x86"              return handle_token(this, 'CC_PREDEF_VAR_X86');
<CCON,CCMNT>"@_mc68x0"           return handle_token(this, 'CC_PREDEF_VAR_MC68X0');
<CCON,CCMNT>"@_PowerPC"          return handle_token(this, 'CC_PREDEF_VAR_POWERPC');
<CCON,CCMNT>"@_jscript"          return handle_token(this, 'CC_PREDEF_VAR_JSCRIPT');
<CCON,CCMNT>"@_jscript_build"    return handle_token(this, 'CC_PREDEF_VAR_JSCRIPT_BUILD');
<CCON,CCMNT>"@_jscript_version"  return handle_token(this, 'CC_PREDEF_VAR_JSCRIPT_VERSION');

// ===============
// C O M M E N T S
// ===============
//
//
// Single-Line Comments
//
<INITIAL>[/]{2}                  { this.begin("SLC"); return handle_token(this, 'OPEN_SLINE_COMMENT'); }
<SLC>\n                          { this.popState(); return handle_token(this, 'CLOSE_SLINE_COMMENT'); }
//
// Multi-Line Comments
//
<INITIAL>\/\*                    { this.begin("MLC"); return handle_token(this, 'OPEN_MLINE_COMMENT'); }
<MLC>\*\/                        { this.popState(); return handle_token(this, 'CLOSE_MLINE_COMMENT'); }
<MLC>.                           ;


<*><<EOF>>                       return 'EOF';
<*>{WHITESPACE}+                 ;
<*>[\r\n]+                       ;
<*>{UNKNOWN}                     ;

%%
