var foo = eval;

function bar () {};

foo(bar(3 * "1+1"));
foo("2+2");
eval("3+3");
