#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>
#include <inttypes.h>
#include <tree_sitter/parser.h>

#define EAT_LEADING_WHITESPACE(lexer) \
  while (isspace(lexer->lookahead)) \
    lexer->advance(lexer,true)

#define NDEBUG 0

#define YYPEEK lexer->lookahead
#define YYSKIP lexer->advance(lexer,false)
#define YYSYMBOL lexer->result_symbol
#define YYSETSYMBOL(sym) lexer->result_symbol = sym
#define YYMARKEND lexer->mark_end(lexer)
#define YYCOL lexer->get_column(lexer)

enum TokenType {
  ASSIGNMENT_MARK,
  FILENAME_SPEC,
  PATTERN_SPEC,
  RECIPEPREFIX,
  RULE_MARKER,
  SECONDEXPANSION,
  NLENGTH
};

const int DIRECTIVE   = NLENGTH+1;
const int EMPTY       = NLENGTH+2;
const int RECIPEPREFIX_VAR    = NLENGTH+3;
const int SECONDEXPANSION_FN  = NLENGTH+4;
const int SECONDEXPANSION_PAT = NLENGTH+5;

const char *sym_names[] = {
  "ASSIGNMENT_MARK",
  "FILENAME_SPEC",
  "PATTERN_SPEC",
  "RECIPEPREFIX",
  "RULE_MARKER",
  "SECONDEXPANSION",
  "NLENGTH",
};

typedef struct {
  int32_t recipeprefix;
  bool in_recipe_context;
  bool secondexpansion;
} Scanner_t;

// Lexer generate with re2c
// See lexer.re.c
#include <lexer.c>

void set_recipeprefix(TSLexer *lexer, Scanner_t *scanner) {
  EAT_LEADING_WHITESPACE(lexer);
  scanner->recipeprefix = YYPEEK;
}

bool tree_sitter_make_external_scanner_scan(
void *payload,
TSLexer *lexer,
const bool *valid_symbols) {

  Scanner_t *scanner = payload;
  int ret;

  bool begin_of_line = YYCOL == 0;

  #if NDEBUG
  for (int i=0; i<=NLENGTH; i++)
    if(valid_symbols[i])
      printf ("%-15s ", sym_names[i]);
  printf("\n");
  #endif

  if (valid_symbols[RECIPEPREFIX]) {
    if (begin_of_line) {
      if (scanner->in_recipe_context && YYPEEK == scanner->recipeprefix) {
        YYSETSYMBOL(RECIPEPREFIX);
        YYSKIP;
        return true;
      }
    }
  }

  if (valid_symbols[RULE_MARKER]) {
    // fail on error recovery
    if (valid_symbols[RECIPEPREFIX])
      return false;

    scanner->in_recipe_context = true;

    YYMARKEND; // zero length
    YYSETSYMBOL(RULE_MARKER);
    return RULE_MARKER;
  }

  if (valid_symbols[SECONDEXPANSION]) {
    YYMARKEND; // zero length
    YYSETSYMBOL(SECONDEXPANSION);
    return scanner->secondexpansion;
  }

  EAT_LEADING_WHITESPACE(lexer);

  YYMARKEND; // zero length

  ret = lex_name(lexer);

  switch (ret) {
    case RECIPEPREFIX_VAR:
      EAT_LEADING_WHITESPACE(lexer);
      if (valid_symbols[ASSIGNMENT_MARK])
        scanner->recipeprefix = YYPEEK;

    case ASSIGNMENT_MARK:
      YYSETSYMBOL(ASSIGNMENT_MARK);
      return valid_symbols[ASSIGNMENT_MARK];

    case SECONDEXPANSION_FN:
      if (valid_symbols[FILENAME_SPEC] && begin_of_line)
        scanner->secondexpansion = true;

    case FILENAME_SPEC:
      YYSETSYMBOL(FILENAME_SPEC);
      return valid_symbols[FILENAME_SPEC] && begin_of_line;

    case SECONDEXPANSION_PAT:
      if (valid_symbols[PATTERN_SPEC] && begin_of_line)
        scanner->secondexpansion = true;

    case PATTERN_SPEC:
      YYSETSYMBOL(ret);
      return valid_symbols[PATTERN_SPEC] && begin_of_line;
  }

  return false;
}

void *tree_sitter_make_external_scanner_create() {
  Scanner_t *scanner = calloc(1,sizeof(Scanner_t));
  assert(scanner);

  scanner->recipeprefix = (int32_t) '\t';
  scanner->in_recipe_context = false;
  scanner->secondexpansion   = false;

  return scanner;
}

void tree_sitter_make_external_scanner_destroy(void *payload) {
  free(payload);
}

unsigned tree_sitter_make_external_scanner_serialize(void *payload, char *buffer) {

  memcpy(&buffer, &payload, sizeof(Scanner_t));

  return sizeof(Scanner_t);
}

void tree_sitter_make_external_scanner_deserialize(
void *payload,
const char *buffer,
unsigned length) {

  memcpy(&payload, &buffer, length);

}
