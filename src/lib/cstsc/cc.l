%x CCMNT CCON CCIF CCSET MLC SLC DQS SQS

UNKNOWN              .
WHITESPACE           [ \t]
JS_VAR_NAME          \@[A-Za-z0-9_][A-Za-z0-9_]*

%%


// =============
// S T R I N G S
// =============
//
// Double-quoted strings.
<INITIAL>\"                      { this.begin("DQS"); return 'OPEN_DQUOTE_STRING' };
<DQS>[\\]"\""                    ;
<DQS>\"                          { this.popState(); return 'CLOSE_DQUOTE_STRING' };
<DQS>.                           ;
//
// Single-quoted strings.
//
<INITIAL>"'"                     { this.begin("SQS"); return 'OPEN_SQUOTE_STRING' };
<SQS>[\\]"'"                     ;
<SQS>\'                          { this.popState(); return 'CLOSE_SQUOTE_STRING' };
<SQS>.                           ;

// ===========
// CC Specific
// ===========
//
<INITIAL>\/\*\@cc_on             { this.begin("CCON"); this.begin("CCMNT"); return 'OPEN_CC_COMMENT_CC_ON' }
<INITIAL>\@cc_on                 { this.begin("CCON"); return 'CC_ON_LITERAL'; }
<CCON>\@cc_on                    ; /* Ignore further @cc_on calls if CC is already on. */

// Conditionals
<CCON,CCMNT>\/\*\@if             { this.begin("CCMNT"); this.begin("CCIF"); return 'OPEN_COMMENT_CC_IF' }
<INITIAL,CCON>@if                { this.begin("CCON"); this.begin("CCIF"); return 'BEGIN_CC_IF'; }


<INITIAL,CCON,CCMNT>\@if         { this.begin("CCIF"); return 'BEGIN_CC_IF'; }
<CCIF>\@else                     return 'BEGIN_CC_IF_ELSE';
<CCIF>\@end                      { this.popState(); return 'CLOSE_CC_IF' }

<CCMNT>\/\*\@                    { this.begin("CCMNT");  return 'OPEN_CC_COMMENT' }
<CCMNT>\@\*\/                    { this.popState();    return 'CLOSE_CC_COMMENT' }

<INITIAL,CCON,CCMNT>\@set        { this.begin("CCSET"); return 'OPEN_CC_SET' }
<CCSET>{JS_VAR_NAME}             { this.popState(); return 'CC_VAR_NAME'; }
//
// Predefined Variables
//
<CCON,CCMNT>"@_win32"            return 'CC_PREDEF_VAR_WIN32';
<CCON,CCMNT>"@_win16"            return 'CC_PREDEF_VAR_WIN16';
<CCON,CCMNT>"@_mac"              return 'CC_PREDEF_VAR_MAC';
<CCON,CCMNT>"@_alpha"            return 'CC_PREDEF_VAR_ALPHA';
<CCON,CCMNT>"@_x86"              return 'CC_PREDEF_VAR_X86';
<CCON,CCMNT>"@_mc68x0"           return 'CC_PREDEF_VAR_MC68X0';
<CCON,CCMNT>"@_PowerPC"          return 'CC_PREDEF_VAR_POWERPC';
<CCON,CCMNT>"@_jscript"          return 'CC_PREDEF_VAR_JSCRIPT';
<CCON,CCMNT>"@_jscript_build"    return 'CC_PREDEF_VAR_JSCRIPT_BUILD';
<CCON,CCMNT>"@_jscript_version"  return 'CC_PREDEF_VAR_JSCRIPT_VERSION';

// ===============
// C O M M E N T S
// ===============
//
//
// Single-Line Comments
//
<INITIAL>[/]{2}                  { this.begin("SLC"); return 'OPEN_SLINE_COMMENT' }
<SLC>\n                          { this.popState(); return 'CLOSE_SLINE_COMMENT' }
//
// Multi-Line Comments
//
<INITIAL>\/\*                    { this.begin("MLC"); return 'OPEN_MLINE_COMMENT' }
<MLC>\*\/                        { this.popState(); return 'CLOSE_MLINE_COMMENT' }


<*><<EOF>>                       return 'EOF';
<*>{WHITESPACE}+                 ;
<*>[\r\n]+                       ;
<*>{UNKNOWN}                     ;

%%