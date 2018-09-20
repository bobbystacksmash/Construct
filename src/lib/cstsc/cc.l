%x CCC CCON CCIF CCSET MLC SLC DQS SQS

UNKNOWN              .
WHITESPACE           [ \t]

%%


// =============
// S T R I N G S
// =============
//
// Double-quoted strings.
<INITIAL>\"                { this.begin("DQS"); return 'OPEN_DQUOTE_STRING' };
<DQS>[\\]"\""              ;
<DQS>\"                    { this.popState(); return 'CLOSE_DQUOTE_STRING' };
<DQS>.                     ;
//
// Single-quoted strings.
//
<INITIAL>"'"               { this.begin("SQS"); return 'OPEN_SQUOTE_STRING' };
<SQS>[\\]"'"               ;
<SQS>\'                    { this.popState(); return 'CLOSE_SQUOTE_STRING' };
<SQS>.                     ;

// ===========
// CC Specific
// ===========
//
<INITIAL>\/\*\@cc_on      { this.begin("CCON"); this.begin("CCC"); return 'OPEN_CC_COMMENT_CC_ON' }
<INITIAL>\@cc_on          { this.begin("CCON"); return 'CC_ON_STANDALONE'; }
<CCON>\@cc_on             ; /* Ignore further @cc_on calls if CC is already on. */

// Conditionals
<CCON,CCC>\/\*\@if        { this.begin("CCC"); this.begin("CCIF"); return 'OPEN_COMMENT_CC_IF' }
<INITIAL,CCON,CCC>\@if    { this.begin("CCIF"); return 'OPEN_CC_IF'; }
<CCIF>\@else              return 'BEGIN_CC_IF_ELSE';
<CCIF>\@end               { this.popState(); return 'CLOSE_CC_IF' }

<CCC>\/\*\@               { this.begin("CCC");  return 'OPEN_CC_COMMENT' }
<CCC>\@\*\/               { this.popState();    return 'CLOSE_CC_COMMENT' }

<CCON,CCC,CCIF>\@set      { this.begin("CCSET"); return 'OPEN_CC_SET' }
<CCSET>\@[A-Za-z0-9_][A-Za-z0-9_]* return 'CC_VAR_NAME';


// ===============
// C O M M E N T S
// ===============
//
//
// Single-Line Comments
//
<INITIAL>[/]{2}           { this.begin("SLC"); return 'OPEN_SLINE_COMMENT' }
<SLC>\n                   { this.popState(); return 'CLOSE_SLINE_COMMENT' }
//
// Multi-Line Comments
//
<INITIAL>\/\*              { this.begin("MLC"); return 'OPEN_MLINE_COMMENT' }
<MLC>\*\/                  { this.popState(); return 'CLOSE_MLINE_COMMENT' }




<*><<EOF>>                 return 'EOF';
<*>{WHITESPACE}+           ;
<*>[\r\n]+                 ;
<*>{UNKNOWN}               ;

%%
