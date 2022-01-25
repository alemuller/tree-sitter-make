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
  ],

  extras: $ => [
    /[ \t]+/,
    $._split,
    $.comment
  ],

  inline: $ => [
    $._variable_head , $._filename_head , $._pattern_head ,
    $._variable_trail, $._filename_trail, $._pattern_trail,
  ],

  conflicts: $ => [
    // target specification conflict
    [$.filename , $.pattern],
  ],

  supertypes: $ => [
    $._rule,
    $._variable_definition,
  ],

  rules: {

    makefile: $ => repeat($._kind_of_things),

    _kind_of_things: $ => choice(
      $._variable_definition,
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

    target_specific: $ => seq(
      $._filenames_specification, $.variable_assignment
    ),

    pattern_specific: $ => seq(
      $._patterns_specification, $.variable_assignment
    ),

    variable_assignment: $ => seq(
      field('modifier', optional('private')),
      $._variable_marker,
      field('name', $.variable),
      field('operator', choice(...ASSIGNMENT_OPERATOR)),
      field('value', optional($._assignment_value)),
      $._nl
    ),

    _assignment_value: $ => alias($.line_without_leading_ws, $.text),

    // =====
    // Rules
    // =====
    _rule: $ => choice(
      $.ordinary_rule,
      $.pattern_rule,
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
      $.recipe_context
    ),

    pattern_rule: $ => seq(
      $._patterns_specification,
      optional($.prerequisites),
      $.recipe_context
    ),

    // -------
    // Recipes
    // -------
    recipe_context: $ => $._nl,

    // ===============
    // Names and text
    // ===============

    // -----
    // Names
    // -----
    variable: $ =>      prec.left(seq($._variable_head, optional($._variable_trail))),
    filename: $ => prec.dynamic(1,seq($._filename_head, optional($._filename_trail))),
    pattern:  $ =>                seq($._pattern_head , optional($._pattern_trail )),

    library:  $ => seq('-l', optional($._pattern_trail)),

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
    _variable_trail: $ => repeat1(choice(
      immd(NAME_CHAR),
      $._expansion_immd
    )),

    _filename_trail: $ => repeat1(choice(
            immd(NAME_CHAR),
      alias(immd(FILE_QUOTE),$.quote),
      $._expansion_immd
    )),

    _pattern_trail: $ => repeat1(choice(
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
    line_without_leading_ws: $ => seq($._no_ws_head, optional($._line_trail)),

    _no_ws_head: $ => choice(
      token(repeat1(anyBut(RESERVED_TEXT_CHARS.concat(' ','\t')))),
      $._expansion
    ),

    _line_trail: $ => repeat1(choice(
      immd(TEXT_CHAR),
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
