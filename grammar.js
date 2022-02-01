const immd = (x) => token.immediate(x);

const ASSIGNMENT_OPERATOR = ['=',':=','::=','+=','?=','!='];
const RULE_SEPARATOR      = [':','::','&:','&::'];
const AUTOMATIC_VARIABLE  = ['@','%','<','?','^','+','*'];

const BLANK      = [' ','\t'];
const NEWLINE    = ['\f','\n','\r','\v'];
const LINE_SPLIT = ['\\\r\n','\\\n'];

module.exports = grammar({
  name: 'make',

  externals: $ => [
    $._variable_marker,
    $._filename_marker,
    $._pattern_marker,
    $.recipeprefix,
    $._rule_marker,
    $._2nd_expansion
  ],

  extras: $ => [
    /[ \t]+/,
    $.split,
    $.comment
  ],

  inline: $ => [
    $._inlined_recipe_context,
    $._default_recipe_context,
  ],

  conflicts: $ => [
    // target specification conflict
    [$.filename     , $.pattern],
    [$.filename_immd, $.pattern_immd],
  ],

  supertypes: $ => [
    $._variable_definition,
    $._directive,
    $._rule,
  ],

  rules: {

    makefile: $ => repeat($._kind_of_things),

    _kind_of_things: $ => choice(
      $._variable_definition,
      $._directive,
      $._rule,
      $._expansion,
      $._nl,
    ),

    // ===================
    // Variable definition
    // ===================
    _variable_definition: $ => choice(
      $.target_specific,
      $.pattern_specific,
      $.variable_assignment,
      $.define_directive,   // 6.8
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
      optional($._blank), // leading blank shall not be matched by text
      field('value', optional(alias($.assignment_value, $.text))),
      $._nl
    ),

    assignment_value: $ => sepBy($.split, $._stop_at_comment),

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
      optional($._order_only_prereq),
      $.recipe_context
    ),

    _order_only_prereq: $ => seq(
      '|',
      optional(alias($.prerequisites, $.order_prerequisites))
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

    // ======
    // Recipe
    // ======
    recipe_context: $ => prec.right(choice(
      $._inlined_recipe_context,
      $._default_recipe_context,
    )),

    _inlined_recipe_context: $ => seq(
      seq(';', $._rule_marker, $.recipe),
      repeat(choice(
        $.conditional_directive,
        $._recipe_line,
        $._nl
      ))
    ),

    _default_recipe_context: $ => seq(
      $._nl,
      $._rule_marker,
      repeat(choice(
        $.conditional_directive,
        $._recipe_line,
        $._nl
      ))
    ),

    _recipe_line: $ => seq($.recipeprefix, $.recipe),

    recipe: $ => seq(
      repeat($._special_prefix),
      choice(
        $._simple_recipe_line,
        $._wraped_recipe_line,
      )
    ),

    // leading blanks are ignored
    _special_prefix: $ => choice(
      ...['+','-','@',...BLANK].map(c => immd(prec(1,c)))),

    _simple_recipe_line: $ => alias($._stop_after_newline, $.shell_code),

    _wraped_recipe_line: $ => seq(
      alias($._stop_after_split, $.shell_code),
      choice(
        seq(optional($.recipeprefix), $._simple_recipe_line),
        seq(optional($.recipeprefix), $._wraped_recipe_line),
      )
    ),

    // ==========
    // Directives
    // ==========
    _directive: $ => choice(
      $.include_directive,  // 3.3
      $.vpath_directive,    // 4.5.2
      $.export_directive,   // 5.7.2
      $.unexport_directive, // 5.7.2
      $.override_directive, // 6.7
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
        alias($.filename_immd, $.filename)
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
      seq('override', $.define_directive),
      seq('override', $.undefine_directive),
    ),

    undefine_directive: $ => seq(
      'undefine', $.variable, $._nl
    ),

    // TODO: allow nested directives
    define_directive: $ => seq(
      'define',
      field('name', $.variable),
      field('operator', optional(choice(...ASSIGNMENT_OPERATOR))),
      $._nl,
      field('value', optional(alias($.definition_value, $.text))),
      'endef',
      $._nl,
    ),

    definition_value: $ => repeat1(seq($._stop_at_comment, $._nl)),

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

    body: $ => repeat1(choice(
      $._kind_of_things,
      $._recipe_line
    )),

    alternative: $ => choice(
      seq('else', $._conditional_directive),
      seq('else', $._nl, optional($.body))
    ),

    condition: $ => choice(
      seq('ifeq' ,  $.comparison, $._nl),
      seq('ifneq',  $.comparison, $._nl),
      seq('ifdef',  $.variable  , $._nl),
      seq('ifndef', $.variable  , $._nl),
    ),

    comparison: $ => choice(
      seq('(', field('arg1', optional($._arg)), ',', field('arg2', optional($._arg)), ')'),
      seq(     field('arg1',          $._str),       field('arg2',          $._str)      ),
    ),

    _arg: $ => alias($._stop_at_endparent, $.text),

    _str: $ => choice(
      seq("'",  optional(alias($._stop_at_squote, $.text)), immd("'")),
      seq('"',  optional(alias($._stop_at_dquote, $.text)), immd('"'))
    ),

    // ===============
    // Names and text
    // ===============

    // -----
    // Names
    // -----
    variable: $ => {
      // set of leading chars of ASSIGNMENT_OPERATOR
      const CONFLICT = ASSIGNMENT_OPERATOR.reduce((set, op) =>
        set.includes(op[0]) ? set : set.concat(op[0]), ['\\']);

      const NIBBLE = repeat1(anyBut(
        ...CONFLICT, ...BLANK, ...NEWLINE, '$', '#'
      ));

      return genText($,
        token(NIBBLE), choice($._expansion     , token(choice(...CONFLICT))),
         immd(NIBBLE), choice($._expansion_immd,  immd(choice(...CONFLICT))),
      );
    },

    filename      : $ => prec.dynamic(1,genTarget($,'filename')),
    filename_immd : $ => prec.dynamic(1,genTarget($,'filename',true)),
    pattern       : $ => genTarget($,'pattern'),
    pattern_immd  : $ => genTarget($,'pattern' ,true, '}'),

    library:  $ => seq(token(prec(2,'-l')), optional(immd(/[^\s]+/))),

    archive: $ => prec.dynamic(1,choice(
      seq(field('name',$.filename), immd('('), $._members, immd(')')),
      seq(                               '(' , $._members, immd(')')),
    )),

    _members: $ => field('member',seq(
      choice(
        alias($.filename_immd, $.filename),
        alias($.pattern_immd , $.pattern),
      ),
      repeat(choice(
        $.filename,
        $.pattern
      )),
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

    // =========
    // Expansion
    // =========
    _expansion: $ => choice(
      $.variable_reference,
      $.substitution_reference,
      $.function_expansion,
      $.quote
    ),

    _expansion_immd: $ => choice(
      alias($.variable_reference_immd    , $.variable_reference),
      alias($.function_expansion_immd    , $.function_expansion),
      alias($.substitution_reference_immd, $.substitution_reference),
      alias($.quote_immd                 , $.quote),
    ),

    //

    variable_reference: $ => choice(
      seq(token('$') , $._variable_reference),
      seq(token('$$'), $._2nd_expansion, $._variable_reference),
    ),

    variable_reference_immd: $ => choice(
      seq(immd('$') , $._variable_reference),
      seq(immd('$$'), $._2nd_expansion, $._variable_reference),
    ),

    //

    substitution_reference: $ => choice(
      seq(token('$') , $._substitution_reference),
      seq(token('$$'), $._2nd_expansion, $._substitution_reference),
    ),

    substitution_reference_immd: $ => choice(
      seq(immd('$') , $._substitution_reference),
      seq(immd('$$'), $._2nd_expansion, $._substitution_reference),
    ),

    //

    function_expansion: $ => choice(
      seq(token('$') , $._function_expansion),
      seq(token('$$'), $._2nd_expansion, $._function_expansion),
    ),

    function_expansion_immd: $ => choice(
      seq(immd('$') , $._function_expansion),
      seq(immd('$$'), $._2nd_expansion, $._function_expansion),
    ),

    //

    quote:      $ => seq(token('$$')),
    quote_immd: $ => seq( immd('$$')),

    //

    _variable_reference: $ => choice(
      $.automatic_variable,
      alias(immd(/[^${(]/), $.variable),
      seq(immd('{'), optional(alias($.varref_braces,$.variable)), immd('}')),
      seq(immd('('), optional(alias($.varref_parent,$.variable)), immd(')')),
      seq(immd('{'), optional(alias($.automatic_variable_delim,$.automatic_variable)), immd('}')),
      seq(immd('('), optional(alias($.automatic_variable_delim,$.automatic_variable)), immd(')')),
    ),

    automatic_variable: $ => choice(
      ...AUTOMATIC_VARIABLE.map(immd)
    ),

    automatic_variable_delim: $ => choice(
      ...AUTOMATIC_VARIABLE.map(immd),
      ...AUTOMATIC_VARIABLE.map(c => immd(c+'D')),
      ...AUTOMATIC_VARIABLE.map(c => immd(c+'F'))
    ),

    _substitution_reference: $ => choice(
      seq(
        immd('{'),
        optional(alias($.varref_braces,$.variable)),
        $._subs_ref,
        immd('}')
      ),
      seq(
        immd('('),
        optional(alias($.varref_parent,$.variable)),
        $._subs_ref,
        immd(')')
      ),
    ),

    _subs_ref: $ => seq(
      immd(':'),
      field('from', alias($.pattern_immd,$.pattern)),
      immd('='),
      field('to', alias($.pattern_immd,$.pattern)),
    ),

    // Function expansion
    // ------------------
    _function_expansion: $ => choice(
      seq(
        immd('{'),
        field('function', alias($.varref_braces, $.name)),
        $._blank, // shall have at least one blank after name
        alias($.arguments_braces, $.arguments),
        immd('}')
      ),
      seq(
        immd('('),
        field('function', alias($.varref_parent, $.name)),
        $._blank, // shall have at least one blank after name
        alias($.arguments_paren, $.arguments),
        immd(')')
      ),
    ),

    arguments_braces: $ => sepBy(',',
      field('argument', alias($.argument_braces, $.text))
    ),

    argument_braces: $ => sepBy($.split, $._stop_at_endparent),

    arguments_paren: $ => sepBy(',',
      field('argument', alias($.argument_paren, $.text))
    ),

    argument_paren : $ => sepBy($.split, $._stop_at_endparent),

    // Text
    // ====
    _stop_at_endparent: $ => immdText($,textToken(')',',')),
    _stop_at_endbraces: $ => immdText($,textToken('}',',')),
    _stop_at_comment:   $ => immdText($,textToken('#')),
    _stop_at_squote:    $ => immdText($,textToken('#',"'")),
    _stop_at_dquote:    $ => immdText($,textToken('#','"')),

    _stop_after_newline: $ => seq(optional(immdText($,textToken(''))), $._nl),
    _stop_after_split  : $ => seq(optional(immdText($,textToken(''))), $.split),

    varref_braces: $ => immdText($,textToken(' ','\t','#',':','=','}')),
    varref_parent: $ => immdText($,textToken(' ','\t','#',':','=',')')),

    // Some tokens
    // ===========
    _blank: $ => repeat1(choice(
      immd(choice(...BLANK)),
      alias(immd(choice(...LINE_SPLIT)), $.split),
    )),

    comment: $ => token(/#(.*?\\\r?\n)*.*\r?\n/),

    split: $ => token(choice(...LINE_SPLIT)),
    _nl:   $ => token(choice(...NEWLINE)),

  }

});

function sepBy(del, rule) {
  return seq(rule, repeat(seq(del, rule)));
}

// From https://stackoverflow.com/a/6969486
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// create a negated character class
function anyBut(...excludeset) {
  //let set = [new Set(excludeset)]; // TODO

  let esc = [...excludeset.map(escapeRegExp)];
  return new RegExp('[^' + esc.join('') + ']');
}

function genText($, token, nested, tokenImmd, nestedImmd) {
  // nested rules may be followed by another nested rules
  // token shall not be followed by another token
  const trailing = repeat(seq(nestedImmd, optional(tokenImmd)));

  return choice(
    seq(token                      , trailing),
    seq(nested, optional(tokenImmd), trailing),
  );
}

function genTarget($, kind, immediate=false, exclude='') {

  const quote = (rule) => alias(rule,$.quote);

  const CONFLICT = RULE_SEPARATOR.reduce((set, op) =>
    set.includes(op[0]) ? set : set.concat(op[0]), ['\\']);

  const NIBBLE = repeat1(anyBut(
    ...CONFLICT, ...BLANK, ...NEWLINE, '$', '%', '#', '(', ')', '=', ...exclude
  ));

  const QUOTE = seq('\\',anyBut(...NEWLINE, '%', '$', '='));

  let nested     = [quote(token(QUOTE)), token(choice(...CONFLICT))];
  let nestedImmd = [quote( immd(QUOTE)),  immd(choice(...CONFLICT))];

  if (kind == 'pattern') {
    nested.push(quote(token('\\'+'%')));
    nested.push(token('%'));

    nestedImmd.push(quote(immd('\\'+'%')));
    nestedImmd.push(immd('%'));
  }

  if (immediate == true) {

    return genText($,
      immd(NIBBLE), choice($._expansion_immd, ...nestedImmd),
      immd(NIBBLE), choice($._expansion_immd, ...nestedImmd),
    );
  }

  return genText($,
    token(NIBBLE), choice($._expansion     , ...nested     ),
     immd(NIBBLE), choice($._expansion_immd, ...nestedImmd),
  );
}


function immdText($,regex) {
  return genText($,
    immd(regex), choice($._expansion_immd, immd(/\\/)),
    immd(regex), choice($._expansion_immd, immd(/\\/))
  );
}

function textToken(...stopset) {
  let char  =           anyBut('\r','\n','$',...stopset,'\\');
  let quote = seq('\\', anyBut('\r','\n','$',...stopset));

  return repeat1(choice(char, quote));
}
