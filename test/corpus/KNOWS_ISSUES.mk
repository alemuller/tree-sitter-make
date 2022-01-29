================================================================================
Rule, targets, line split, expansions
================================================================================
foo\
${bar}\
${bar}baz\
foo${bar}\
foo${bar}baz:

---

;; Tree-sitter is accepting immd after extra

(makefile
  (ordinary_rule
    (targets
      (filename)
      (split)
      (filename
        (variable_reference
          (variable)))
      (split)
      (filename
        (variable_reference
          (variable)))
      (split)
      (filename
        (variable_reference
          (variable)))
      (split)
      (filename
        (variable_reference
          (variable))))
    (recipe_context)))
