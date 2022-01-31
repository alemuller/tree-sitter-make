====================
TS #1627 default recipe prefix (before)
====================
foo:
	echo foo

---

(makefile
  (ordinary_rule
    (targets
      (filename))
    (recipe_context
      (recipeprefix)
      (recipe
        (shell_code)))))

====================
TS #1627 custom recipe prefix
====================
.RECIPEPREFIX=>
foo:
>echo foo

---

(makefile
  (variable_assignment
    name: (variable)
    value: (text))
  (ordinary_rule
    (targets
      (filename))
    (recipe_context
      (recipeprefix)
      (recipe
        (shell_code)))))

====================
TS #1627 default recipe prefix (after)
====================
foo:
	echo foo

---

(makefile
  (ordinary_rule
    (targets
      (filename))
    (recipe_context
      (recipeprefix)
      (recipe
        (shell_code)))))
