%x CCC CCON CCIF MLC SLC DQS SQS

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


// ===============
// C O M M E N T S
// ===============
//
<INITIAL>\/\*\@cc_on      { this.begin("CCON"); this.begin("CCC"); return 'OPEN_CC_COMMENT_CC_ON' }
<INITIAL>\@cc_on          { this.begin("CCON"); return 'CC_ON_STANDALONE'; }

<CCON,CCC>\/\*\@if        { this.begin("CCC"); this.begin("CCIF"); return 'OPEN_COMMENT_CC_IF' }
<CCIF>\@else              return 'CC_IF_ELSE_BEGIN';
<CCIF>\@end               { this.popState(); return 'CC_IF_END' }

<CCC>\/\*\@               { this.begin("CCC");  return 'OPEN_CC_COMMENT' }
<CCC>\@\*\/               { this.popState();    return 'CLOSE_CC_COMMENT' }



//
// Single-Line Comments
//
<INITIAL>[/]{2}           { this.begin("SLC"); return 'OPEN_SLINE_COMMENT' }
<SLC>\n                   { this.popState(); return 'END_SLINE_COMMENT' }
//
// Multi-Line Comments
//
<INITIAL>\/\*              { this.begin("MLC"); return 'OPEN_MLINE_COMMENT' }
<MLC>\*\/                  { this.popState(); return 'END_MLINE_COMMENT' }




<*><<EOF>>                 return 'EOF';
<*>{WHITESPACE}+           ;
<*>[\r\n]+                 ;
<*>{UNKNOWN}               ;

%%
