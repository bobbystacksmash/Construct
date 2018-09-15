%x CC

UNKNOWN              .
WHITESPACE           [ \t]

%%


<INITIAL>\/\*\@cc_on        { this.begin("CC"); return 'CC_ON';  }
<CC>\@\*\/                  { this.popState();  return 'CC_OFF'; }

<CC>\@_win32             return 'CC_VAR_WIN32';
<CC>\@_win16             return 'CC_VAR_WIN16';
<CC>\@_mac               return 'CC_VAR_MAC';
<CC>\@_alpha             return 'CC_VAR_PROC_DEC_ALPHA';
<CC>\@_x86               return 'CC_VAR_PROC_INTEL';
<CC>\@_mc60x0            return 'CC_VAR_PROC_MOTO6800';
<CC>\@_PowerPC           return 'CC_VAR_PROC_PPC';
<CC>\@_jscript           return 'CC_VAR_JSCRIPT';
<CC>\@_jscript_build     return 'CC_VAR_JSCRIPT_BUILD';
<CC>\@_jscript_version   return 'CC_VAR_JSCRIPT_VERSION';


<*><<EOF>>                 return 'EOF';
<*>{WHITESPACE}+           ;
<*>[\r\n]+                 ;
<*>{UNKNOWN}               ;

%%
