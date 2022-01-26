const immd = (x) => token.immediate(x);

const ASSIGNMENT_OPERATOR = [ '=',':=','::=','+=','?=','!=' ];
const RULE_SEPARATOR = [ ':','::','&:','&::' ];

const RESERVED_NAME_CHARS = ['\r', '\n', '\t', '#', '$', '=', ':', ' '];
const RESERVED_TEXT_CHARS = ['\r', '\n', '\t', '#', '$', '\\'];

const NAME_CHAR  = anyBut(RESERVED_NAME_CHARS);
const TEXT_CHAR  = anyBut(RESERVED_TEXT_CHARS);
const PATT_STEM  = prec(2,'%');
const FILE_QUOTE = genQuotes(' ','#','\\',':');
const PATT_QUOTE = genQuotes('%');

const NEWLINE = ['\n','\r\n'];
const LINE_SPLIT = genQuotes(...NEWLINE);

const AUTO_VAR = ['@','%','<','?','^','+','|','*','?'];

module.exports = grammar({
  name: 'make',

  externals: $ => [
    $._variable_marker,
    $._filename_marker,
    $._pattern_marker,
    $.recipeprefix,
    $._rule_marker,
  ],

  extras: $ => [
    /[ \t]+/,
    $._split,
    $.comment
  ],

  inline: $ => [
    $._variable_head, $._filename_head, $._pattern_head,
    $._variable_immd, $._filename_immd, $._pattern_immd,
    $._inlined_recipe_context,
    $._default_recipe_context,
  ],

  conflicts: $ => [
    // target specification conflict
    [$.filename , $.pattern],
  ],

  supertypes: $ => [
    $._rule,
    $._directive,
    $._variable_definition,
  ],

  rules: {

    makefile: $ => repeat($._kind_of_things),

    _kind_of_things: $ => choice(
      $._variable_definition,
      $._recipe_line,
      $._directive,
      $._rule,
      $._nl
    ),

    // ===================
    // Variable definition
    // ===================
    _variable_definition: $ => choice(
      $.target_specific,
      $.pattern_specific,
      $.variable_assignment,
    ),

    target_specific: $ => choice(
      seq($._filenames_specification, $.variable_assignment),
      seq($._filenames_specification, $.override_directive),
      seq($._filenames_specification, $.export_directive),
    ),

    pattern_specific: $ => choice(
      seq($._patterns_specification, $.variable_assignment),
      seq($._patterns_specification, $.override_directive),
      seq($._patterns_specification, $.export_directive),
    ),

    variable_assignment: $ => seq(
      field('modifier', optional('private')),
      $._variable_marker,
      field('name', $.variable),
      field('operator', choice(...ASSIGNMENT_OPERATOR)),
      field('value', optional(alias($.value, $.text))),
      $._nl
    ),

    // =====
    // Rules
    // =====
    _rule: $ => choice(
      $.ordinary_rule,
      $.pattern_rule,
      $.static_pattern_rule
    ),

    // --------------------
    // Target specification
    // --------------------
    _filenames_specification: $ => seq(
      $._filename_marker,
      $.targets,
      choice(...RULE_SEPARATOR.map(c => token(prec(2,c)))),
    ),

    _patterns_specification: $ => seq(
      $._pattern_marker,
      $.targets,
      choice(...RULE_SEPARATOR.map(c => token(prec(2,c)))),
    ),

    // ------------
    // Actual rules
    // ------------
    ordinary_rule: $ => seq(
      $._filenames_specification,
      optional($.prerequisites),
      optional(seq(
        '|', optional(alias($.prerequisites, $.order_prerequisites))
      )),
      $.recipe_context
    ),

    pattern_rule: $ => seq(
      $._patterns_specification,
      optional($.prerequisites),
      $.recipe_context
    ),

    static_pattern_rule: $ => seq(
      $._patterns_specification,
      field('target_pattern',$.pattern),
      choice(...RULE_SEPARATOR.map(c => token(prec(2,c)))),
      optional($.prerequisites),
      $.recipe_context
    ),

    // -------
    // Recipes
    // -------
    recipe_context: $ => prec.left(choice(
      $._inlined_recipe_context,
      $._default_recipe_context,
    )),

    _inlined_recipe_context: $ => seq(
      seq(';', $._rule_marker, $.recipe),
      repeat($._kind_of_things)
    ),

    _default_recipe_context: $ => seq(
      $._nl,
      $._rule_marker,
      repeat($._kind_of_things)
    ),

    _recipe_line: $ => seq($.recipeprefix, $.recipe),

    //

    recipe: $ => seq(
      optional($._special_prefix),
      choice(
        $._simple_recipe_line,
        $._wraped_recipe_line,
        $._nl
      )
    ),

    _special_prefix: $ => choice(
      ...['+','-','@'].map(c => immd(prec(1,c)))),

    // newline shall is part of shell_code
    _simple_recipe_line: $ => alias($.til_terminator, $.shell_code),

    // recipeprefix isn't part of the shell_code
    _wraped_recipe_line: $ => seq(
      alias($.til_line_split, $.shell_code),
      choice(
        seq(optional($.recipeprefix), $._simple_recipe_line),
        seq(optional($.recipeprefix), $._wraped_recipe_line),
      )
    ),

    // DO NOT INLINE (aliased as shell code)
    til_terminator: $ => seq($._line, $._nl),
    til_line_split: $ => seq($._line, $._split),

    // ==========
    // Directives
    // ==========
    _directive: $ => choice(
      $.include_directive,  // 3.3
      $.vpath_directive,    // 4.5.2
      $.export_directive,   // 5.7.2
      $.unexport_directive, // 5.7.2
      $.override_directive, // 6.7
      // define_directive   // 6.8
      $.undefine_directive, // 6.9
      $.conditional_directive, // 7
      // load_directive // 12.2.1 TODO
    ),

    include_directive: $ => choice(
      seq(         'include' , repeat1($.filename), $._nl),
      seq(        'sinclude' , repeat1($.filename), $._nl),
      seq('-',immd('include'), repeat1($.filename), $._nl),
    ),

    vpath_directive: $ => choice(
      seq('vpath', $.pattern, $.directories, $._nl),
      seq('vpath', $.pattern, $._nl),
      seq('vpath', $._nl),
    ),

    directories: $ => seq(
      $.filename,
      repeat(seq(
        immd(':'),
        alias($._filename_immd, $.filename)
      ))
    ),

    export_directive: $ => choice(
      seq('export', $.variable_assignment),
      seq('export', $.variable, $._nl),
      seq('export', $._nl),
    ),

    unexport_directive: $ => choice(
      seq('unexport', $.variable, $._nl),
      seq('unexport', $._nl),
    ),

    override_directive: $ => choice(
      seq('override', $.variable_assignment),
      seq('override', $.undefine_directive),
    ),

    undefine_directive: $ => seq(
      'undefine', $.variable, $._nl
    ),

    // ----------------------
    // Conditional Directives
    // ----------------------
    conditional_directive: $ => seq(
      $._conditional_directive,
      'endif',
      $._nl
    ),

    _conditional_directive: $ => seq(
      $.condition,
      optional($.body),
      optional($.alternative)
    ),

    body: $ => repeat1(choice($._kind_of_things)),

    alternative: $ => choice(
      seq('else', $._conditional_directive),
      seq('else', $._nl, optional($.body))
    ),

    condition: $ => choice(
      seq('ifeq' ,  $.comparison, $._nl),
      seq('ifneq',  $.comparison, $._nl),
      seq('ifdef',  $.variable, $._nl),
      seq('ifndef', $.variable, $._nl),
    ),

    comparison: $ => choice(
      seq('(', field('arg1', optional($._arg1) ), ',', field('arg2', optional($._arg2) ), ')'),
      seq(     field('arg1',          $._string),      field('arg2',          $._string)     ),
    ),

    _arg1: $ => alias($.text_no_comma, $.text),
    _arg2: $ => alias($.text_no_paren, $.text),

    _string: $ => choice(
      seq("'",  optional(alias($.text_no_squote, $.text)), immd("'")),
      seq('"',  optional(alias($.text_no_dquote, $.text)), immd('"'))
    ),

    // ===============
    // Names and text
    // ===============

    // -----
    // Names
    // -----
    variable: $ =>      prec.left(seq($._variable_head, optional($._variable_immd))),
    filename: $ => prec.dynamic(1,seq($._filename_head, optional($._filename_immd))),
    pattern:  $ =>                seq($._pattern_head , optional( $._pattern_immd)),

    library:  $ => seq('-l', optional($._pattern_immd)),

    archive: $ => seq(
      field('name',$.filename),
      immd('('),
      repeat1(field('member', $.filename)),
      immd(')'),
    ),

    // TODO expansion
    _variable_head: $ => choice(
      token(NAME_CHAR),
      $._expansion
    ),

    _filename_head: $ => choice(
            token(NAME_CHAR),
      alias(token(FILE_QUOTE),$.quote),
      $._expansion
    ),

    _pattern_head: $ => choice(
            token(NAME_CHAR),
            token(PATT_STEM),
      alias(token(FILE_QUOTE),$.quote),
      alias(token(PATT_QUOTE),$.quote),
      $._expansion
    ),

    // trail tokens shall be immediate
    _variable_immd: $ => repeat1(choice(
      immd(NAME_CHAR),
      $._expansion_immd
    )),

    _filename_immd: $ => repeat1(choice(
            immd(NAME_CHAR),
      alias(immd(FILE_QUOTE),$.quote),
      $._expansion_immd
    )),

    _pattern_immd: $ => repeat1(choice(
            immd(NAME_CHAR),
            immd(PATT_STEM),
      alias(immd(FILE_QUOTE),$.quote),
      alias(immd(PATT_QUOTE),$.quote),
      $._expansion_immd
    )),

    // List of names
    // -------------
    targets: $ => repeat1(choice(
      $.filename,
      $.pattern,
      $.archive,
    )),

    prerequisites: $ => repeat1(choice(
      $.filename,
      $.pattern,
      $.archive,
      $.library,
    )),

    // -----
    // Text
    // -----
    value: $ => seq($._any_but_ws, optional($._line)),

    _any_but_ws: $ => choice(
      token(repeat1(anyBut(RESERVED_TEXT_CHARS.concat(' ','\t')))),
      $._expansion
    ),

    _line: $ => repeat1(choice(
      immd(repeat1(TEXT_CHAR)),
      $._expansion_immd
    )),

    text_no_squote: $ => repeat1(choice(
      immd(repeat1(anyBut(RESERVED_TEXT_CHARS.concat("'")))),
      $._expansion_immd
    )),

    text_no_dquote: $ => repeat1(choice(
      immd(repeat1(anyBut(RESERVED_TEXT_CHARS.concat('"')))),
      $._expansion_immd
    )),

    text_no_comma: $ => repeat1(choice(
      immd(repeat1(anyBut(RESERVED_TEXT_CHARS.concat(',')))),
      $._expansion_immd
    )),

    text_no_paren: $ => repeat1(choice(
      immd(repeat1(anyBut(RESERVED_TEXT_CHARS.concat(')')))),
      $._expansion_immd
    )),

    text_no_brace: $ => repeat1(choice(
      immd(repeat1(anyBut(RESERVED_TEXT_CHARS.concat('}')))),
      $._expansion_immd
    )),

    // =========
    // Expansion
    // =========
    _expansion: $ => choice(
      $.variable_reference,
      $.automatic_variable
    ),

    _expansion_immd: $ => choice(
      alias($.automatic_variable_immd, $.automatic_variable),
      alias($.variable_reference_immd, $.variable_reference),
    ),

    //

    variable_reference     : $ => seq(token('$'), $._variable_reference),
    variable_reference_immd: $ => seq( immd('$'), $._variable_reference),

    automatic_variable     : $ => seq(token('$'), $._automatic_variable),
    automatic_variable_immd: $ => seq( immd('$'), $._automatic_variable),

    //

    _variable_reference: $ => choice(
      alias(immd(/[^${(]/), $.variable),
      seq(immd('{'), optional($.variable), immd('}')),
      seq(immd('('), optional($.variable), immd(')')),
    ),

    _automatic_variable: $ => choice(
      immd(prec(2,choice(...AUTO_VAR))),
      seq(immd('{'), immd(prec(2,choice(...AUTO_VAR))), optional(immd(choice('D','F'))), immd('}')),
      seq(immd('('), immd(prec(2,choice(...AUTO_VAR))), optional(immd(choice('D','F'))), immd(')')),
    ),

    // Some tokens
    // ===========
    _nl: $ => token(choice(...NEWLINE)),

    _split: $ => token(LINE_SPLIT),

    comment: $ => token(/#(.*?\\\r?\n)*.*\r?\n/),
  }

});

// From https://stackoverflow.com/a/6969486
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// create a negated character class
function anyBut(excludeSet) {
  let escaped = excludeSet.map(escapeRegExp);

  return new RegExp('[^' + escaped.join('') + ']');
}

function genQuotes() {
  let arr = Array(...arguments);

  return choice(...arr.map(c => seq('\\',c)))
}
