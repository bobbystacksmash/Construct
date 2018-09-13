NUMBER         \d+
UNKNOWN        .

%%

\/\*\@cc_on         return 'CC_COMMENT_START';
@\*\/               return 'CC_COMMENT_END';

.                   /* ignore bad input */
<*><<EOF>>             return 'EOF';

%%
