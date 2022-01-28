static
int lex_name(TSLexer *lexer) {/*!re2c

    re2c:indent:top = 0;
    re2c:indent:string = "  ";
    re2c:yyfill:enable = 0; // No fill is needed for this parser
    re2c:flags:input = custom;
    re2c:api:style = free-form;

    re2c:define:YYCTYPE    = "int32_t";
    // only used before return, can be ignored
    re2c:define:YYBACKUP   = "/* YYBACKUP \x2A/";
    re2c:define:YYRESTORE  = "/* YYRESTORE \x2A/";
    // Pointers for the current position
    //re2c:define:YYPEEK      = "yypeek(lexer)";
    re2c:define:YYPEEK      = "YYPEEK";
    re2c:define:YYSKIP      = "YYSKIP;";

    assignop =  "="|":="|"::="|"+="|"?="|"!=";
    rulesep  =  ":"|"::"| "&:"|"&::";

    charset   = [^\x00\r\n\t#$=: ];
    backslash = "\\";

    expansion = "$"? "$" [^$#{(]
              | "$"? "${" [^\r\n}]* "}"
              | "$"? "$(" [^\r\n)]* ")";

    wsp = [ \t]|"\\\n"|"\\\r\n";

    variable = (charset|expansion)+;
    filename = (charset\[\\%]|expansion|"\\"[^=\r\n$%])+"\\"?;
    pattern  = (charset\[\\] |expansion|"\\"[^=\r\n$] )+"\\"?;

    directive = "define"   (wsp+ [^\x00=\r\n]*)?
              | "endef"    (wsp+ [^\x00=\r\n]*)?
              | "undefine" (wsp+ [^\x00=\r\n]*)?
              | "ifdef"    (wsp+ [^\x00=\r\n]*)?
              | "ifndef"   (wsp+ [^\x00=\r\n]*)?
              | "include"  (wsp+ [^\x00=\r\n]*)?
              | "-include" (wsp+ [^\x00=\r\n]*)?
              | "sinclude" (wsp+ [^\x00=\r\n]*)?
              | "override" (wsp+ [^\x00=\r\n]*)?
              | "export"   (wsp+ [^\x00=\r\n]*)?
              | "unexport" (wsp+ [^\x00=\r\n]*)?
              | "private"  (wsp+ [^\x00=\r\n]*)?
              | "vpath"    (wsp+ [^\x00=\r\n]*)?
              ;

    *      { return -2; }
    [\x00] { return EMPTY; }

    directive { return DIRECTIVE; }

    // remeber, rules that appear first have precedence
    ".RECIPEPREFIX"    wsp* assignop { return RECIPEPREFIX_VAR;    }
    variable           wsp* assignop { return ASSIGNMENT_MARK;     }

    ".SECONDEXPANSION" (wsp+ filename)* wsp* rulesep { return SECONDEXPANSION_FN; }
    ".SECONDEXPANSION" (wsp+  pattern)* wsp* rulesep { return SECONDEXPANSION_PAT; }
    filename           (wsp+ filename)* wsp* rulesep { return FILENAME_SPEC; }
    pattern            (wsp+  pattern)* wsp* rulesep { return PATTERN_SPEC;  }

*/}
