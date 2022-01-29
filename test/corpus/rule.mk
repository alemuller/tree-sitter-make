================================================================================
Rule, targets, filename
================================================================================
foo/bar/foo.bar:

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context)))

================================================================================
Rule, targets, filename, quote
================================================================================
\#:
\::

---

(makefile
  (ordinary_rule
    (targets (filename (quote)))
    (recipe_context))
  (ordinary_rule
    (targets (filename (quote)))
    (recipe_context)))

================================================================================
Rule, targets, filename, wildcard, begin of name
================================================================================
*.c:
?.c:
[abc].c:
[abc]?.c:
[abc]+.c:
[abc]*.c:

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context)))

================================================================================
Rule, targets, filename, wildcard, end of name
================================================================================
foo.*:
foo.?:
foo.[abc]:
foo.[abc]?:
foo.[abc]+:
foo.[abc]*:

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context))
  (ordinary_rule
    (targets (filename))
    (recipe_context)))

================================================================================
Rule, targets, archive
================================================================================
(bar):
foo(bar):
foo(bar baz):

---

(makefile
  (ordinary_rule
    (targets
      (archive
        member: (filename)))
    (recipe_context))
  (ordinary_rule
    (targets
      (archive
          name: (filename)
        member: (filename)))
    (recipe_context))
  (ordinary_rule
    (targets
      (archive
          name: (filename)
        member: (filename)
        member: (filename)))
    (recipe_context)))
================================================================================
Rule, targets, archive, wildcard
================================================================================
foo(*.o):

---

(makefile
  (ordinary_rule
    (targets
      (archive
          name: (filename)
        member: (filename)))
    (recipe_context)))

================================================================================
Rule, targets, pattern
================================================================================
%:
a%:
%a:
a%a:

---

(makefile
  (pattern_rule
    (targets (pattern))
    (recipe_context))
  (pattern_rule
    (targets (pattern))
    (recipe_context))
  (pattern_rule
    (targets (pattern))
    (recipe_context))
  (pattern_rule
    (targets (pattern))
    (recipe_context)))

================================================================================
Rule, targets, pattern, quote
================================================================================
\%%:
%\%:

---

(makefile
  (pattern_rule
    (targets (pattern (quote)))
    (recipe_context))
  (pattern_rule
    (targets (pattern (quote)))
    (recipe_context)))

================================================================================
Rule, targets, line split, minimal
================================================================================
foo\
bar:

---

(makefile
  (ordinary_rule
    (targets
      (filename)
      (split)
      (filename))
    (recipe_context)))

================================================================================
Rule, targets, names, directives
================================================================================
# Directives aren't reserved words
# But are only allowed if immediatly followed by separator
define:
endef:
undefine:
ifdef:
ifndef:
ifeq:
ifneq:
else:
endif:
include:
!include:
sinclude:
override:
export:
unexport:
private:
vpath:

---

(makefile
  (comment)
  (comment)
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context)))

================================================================================
Rule, recipe, special prefix, minimal
================================================================================
foo:
	@foo
	-foo
	+foo

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code))
      (recipeprefix) (recipe (shell_code))
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, special prefix, combine
================================================================================
foo:
	@-+foo
	@@@foo

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code))
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, special prefix, space
================================================================================
foo:
	 -+foo
	@ +foo
	@- foo

---

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code))
      (recipeprefix) (recipe (shell_code))
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, .RECIPEPREFIX, custom
================================================================================
.RECIPEPREFIX=>
foo:
>echo

---

(makefile
  (variable_assignment
     name: (variable)
    value: (text))
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, .RECIPEPREFIX, whitespace I
================================================================================
.RECIPEPREFIX = >
foo:
>echo

---

(makefile
  (variable_assignment
     name: (variable)
    value: (text))
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, .RECIPEPREFIX, whitespace II
================================================================================
.RECIPEPREFIX =        >
foo:
>echo

---

(makefile
  (variable_assignment
     name: (variable)
    value: (text))
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (recipeprefix) (recipe (shell_code)))))

================================================================================
Rule, recipe, conditional directives
================================================================================
foo:
ifdef x
	@echo
else
	@echo
endif

---

; NOTE
; The error is due tree-sitter not reseting the scanner
; state between test cases

(makefile
  (ordinary_rule
    (targets (filename))
    (recipe_context
      (conditional_directive
        (condition (variable))
        (body
          (recipeprefix) (recipe (shell_code)))
        (alternative
          (body
            (recipeprefix) (recipe (shell_code))))))))


