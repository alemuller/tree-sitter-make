================================================================================
Rule, targets, filename
================================================================================
foo/bar/foo.bar:

---

(makefile
  (ordinary_rule
    (targets
      (filename))
    (recipe_context)))

================================================================================
Rule, targets, filename, quote
================================================================================
\#:
\::

---

(makefile
  (ordinary_rule
    (targets
      (filename
        (quote)))
    (recipe_context))
  (ordinary_rule
    (targets
      (filename
        (quote)))
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
Rule, targets, archive
================================================================================
foo(bar):
foo(bar baz):

---

(makefile
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
    (targets
      (pattern))
    (recipe_context))
  (pattern_rule
    (targets
      (pattern))
    (recipe_context))
  (pattern_rule
    (targets
      (pattern))
    (recipe_context))
  (pattern_rule
    (targets
      (pattern))
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
