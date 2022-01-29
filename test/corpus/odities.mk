=================================================================
Conflicts, names, directive, vpath
=================================================================
# Those are legal assignment:
vpath = bar
vpath = bar:baz
# This is a rule:
vpath:
# This is a directive:
vpath % bar:baz

---

(makefile
  (comment)
  (variable_assignment
    name: (variable)
    value: (text))
  (variable_assignment
    name: (variable)
    value: (text))
  (comment)
  (ordinary_rule
    (targets
      (filename))
    (recipe_context))
  (comment)
  (vpath_directive
    (pattern)
    (directories
      (filename)
      (filename))))
