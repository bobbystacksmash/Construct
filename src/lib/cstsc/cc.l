%x CCB CCON MLC SLC DQS SQS

UNKNOWN              .
WHITESPACE           [ \t]

%%

<INITIAL>\"                { this.begin("DQS"); return 'DQUOTE_STRING_START' };
<DQS>[\\]"\""              ;
<DQS>\"                    { this.popState(); return 'DQUOTE_STRING_END' };
<DQS>.                     ;

<INITIAL>"'"               { this.begin("SQS"); return 'SQUOTE_STRING_START' };
<SQS>[\\]"'"               ;
<SQS>\'                    { this.popState(); return 'SQUOTE_STRING_END' };
<SQS>.                     ;


<*><<EOF>>                 return 'EOF';
<*>{WHITESPACE}+           ;
<*>[\r\n]+                 ;
<*>{UNKNOWN}               ;

%%
