%x CCB CCON MLC SLC DQS SQS

UNKNOWN              .
WHITESPACE           [ \t]

%%

// =============
// S T R I N G S
// =============
//
// Double-quoted strings.
<INITIAL>\"                { this.begin("DQS"); return 'DQUOTE_STRING_BEGIN' };
<DQS>[\\]"\""              ;
<DQS>\"                    { this.popState(); return 'DQUOTE_STRING_END' };
<DQS>.                     ;
//
// Single-quoted strings.
//
<INITIAL>"'"               { this.begin("SQS"); return 'SQUOTE_STRING_BEGIN' };
<SQS>[\\]"'"               ;
<SQS>\'                    { this.popState(); return 'SQUOTE_STRING_END' };
<SQS>.                     ;


// ===============
// C O M M E N T S
// ===============
//
// Single-Line Comments
//
<INITIAL>[/]{2}           { this.begin("SLC"); return 'SLINE_COMMENT_BEGIN' }
<SLC>\n                   { this.popState(); return 'SLINE_COMMENT_END' }
//
// Multi-Line Comments
//
<INITIAL>\/\*              { this.begin("MLC"); return 'MLINE_COMMENT_BEGIN' }
<MLC>\*\/                  { this.popState(); return 'MLINE_COMMENT_END' }




<*><<EOF>>                 return 'EOF';
<*>{WHITESPACE}+           ;
<*>[\r\n]+                 ;
<*>{UNKNOWN}               ;

%%
