UNKNOWN              .
WHITESPACE           [ \t]

%%

\/\*                 return 'COMMENT_START';
\*\/                 return 'COMMENT_END';

\@cc_on              return 'CC_ON';
\@if                 return 'CC_IF';
\@elif               return 'CC_ELIF';
\@else               return 'CC_ELSE';


\(                   return 'LEFT_PAREN';
\)                   return 'RIGHT_PAREN';

[|]{2}               return 'LOGICAL_OR';

// VARIABLES
\@_win32             return 'CC_VAR_WIN32';
\@_win16             return 'CC_VAR_WIN16';
\@_mac               return 'CC_VAR_MAC';
\@_alpha             return 'CC_VAR_PROC_DEC_ALPHA';
\@_x86               return 'CC_VAR_PROC_INTEL';
\@_mc60x0            return 'CC_VAR_PROC_MOTO6800';
\@_PowerPC           return 'CC_VAR_PROC_PPC';
\@_jscript           return 'CC_VAR_JSCRIPT';
\@_jscript_build     return 'CC_VAR_JSCRIPT_BUILD';
\@_jscript_version   return 'CC_VAR_JSCRIPT_VERSION';
<<EOF>>              return 'EOF';

{WHITESPACE}+        ; /*return 'WHITESPACE';*/
[\r\n]+              ;
{UNKNOWN}+           {
                         console.log(this.matched);
                     }
return 'UNKNOWN';


%%
