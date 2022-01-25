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
  VARIABLE,
  FILENAMES,
  PATTERNS,
  // Debug
};

const int DIRECTIVE       = -1;
const int SECONDEXPANSION = VARIABLE;
const int RECIPEPREFIX    = VARIABLE;

const char *sym_names[] = {
  "VARIABLE",
  "FILENAMES",
  "PATTERNS",
};

typedef struct {
  int32_t recipeprefix;
  bool in_recipe_context;
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

#if NDEBUG
  for (int i=0; i<=PATTERNS; i++)
    if(valid_symbols[i])
      printf ("%-15s ", sym_names[i]);
  printf("\n");
#endif

  // NOTES
  // =====
  // RECIPEPREFIX shall be tested before everything else.
  //

  if (valid_symbols[VARIABLE]   ||
      valid_symbols[FILENAMES]  ||
      valid_symbols[PATTERNS]) {

    EAT_LEADING_WHITESPACE(lexer);

    YYMARKEND;

    ret = lex_name(lexer);

    if (ret == RECIPEPREFIX) {
      set_recipeprefix(lexer, scanner);
    }

    YYSETSYMBOL(ret);

    return ((ret == VARIABLE)  && valid_symbols[VARIABLE])
        || ((ret == FILENAMES) && valid_symbols[FILENAMES])
        || ((ret == PATTERNS)  && valid_symbols[PATTERNS]);

  }

  return false;
}

void *tree_sitter_make_external_scanner_create() {
  Scanner_t *scanner = calloc(1,sizeof(Scanner_t));
  assert(scanner);

  scanner->recipeprefix = (int32_t) '\t';
  scanner->in_recipe_context = false;

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
