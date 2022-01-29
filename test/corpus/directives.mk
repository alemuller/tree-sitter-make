==================
Directive, include
==================
 include foo *.mk
-include foo *.mk
sinclude foo *.mk

---

(makefile
  (include_directive
    (filename)
    (filename))
  (include_directive
    (filename)
    (filename))
  (include_directive
    (filename)
    (filename)))

================================
Directive, vpath, minimal
================================
vpath % foo
vpath %
vpath

---

(makefile
  (vpath_directive
    (pattern)
    (directories
      (filename)))
  (vpath_directive
    (pattern))
  (vpath_directive))

=================================
Directive, vpath, delimited paths
=================================
vpath % foo:bar

---

(makefile
  (vpath_directive
    (pattern)
    (directories
      (filename)
      (filename))))

=================================
Directive, export
=================================
export foo = bar
export foo
export

---

(makefile
  (export_directive
    (variable_assignment
       name: (variable)
      value: (text)))
  (export_directive
    (variable))
  (export_directive))

=================================
Directive, unexport
=================================
unexport foo
unexport

---

(makefile
  (unexport_directive
    (variable))
  (unexport_directive))

=================================
Directive, override
=================================
override foo = bar

---

(makefile
  (override_directive
    (variable_assignment
      name: (variable)
      value: (text))))

=================================
Directive, undefine
=================================
undefine foo
override undefine foo

---

(makefile
  (undefine_directive
    (variable))
  (override_directive
    (undefine_directive
      (variable))))

================================================
Directive, conditional, ifeq, comparison, syntax
================================================
ifeq (arg1,arg2)
endif

ifeq 'arg1' 'arg2'
endif

ifeq "arg1" "arg2"
endif

ifeq "arg1" 'arg2'
endif

ifeq 'arg1' "arg2"
endif

---

(makefile
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text)))))

==================================================
Directive, conditional, ifneq, comparison, syntax
==================================================
ifeq (arg1,arg2)
endif

ifeq 'arg1' "arg2"
endif

---

(makefile
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text)
        arg2: (text)))))

=====================================
Directive, conditional, ifdef, syntax
=====================================
ifdef x
endif

---

(makefile
  (conditional_directive
    (condition
      (variable))))

======================================
Directive, conditional, ifndef, syntax
======================================
ifndef x
endif

---

(makefile
  (conditional_directive
    (condition
      (variable))))

===========================================
Directive, conditional, alternative, syntax
===========================================
ifdef x
else ifeq (,)
else ifneq "" ''
else
endif

---

(makefile
  (conditional_directive
    (condition
      (variable))
    (alternative
      (condition
        (comparison))
      (alternative
        (condition
          (comparison))
        (alternative)))))

============================
Directive, conditional, body
============================
ifdef foo
else =
else
endif =
endif

---

(makefile
  (conditional_directive
    (condition (variable))
    (body
      (variable_assignment
        name: (variable)))
    (alternative
      (body
        (variable_assignment
          name: (variable))))))

========================================
Directive, conditional, body, whitespace
========================================
ifdef foo
	else =
else
	endif =
endif

---

; NOTE
; The error is due tree-sitter not reseting the scanner
; state between test cases

(makefile
  (conditional_directive
    (condition
      (variable))
    (body
      (variable_assignment
        name: (variable)))
    (alternative
      (body
        (variable_assignment
          name: (variable))))))

==============================================
Directive, conditional, comparison, expansions
==============================================
ifeq ($x,${y})
endif

ifneq "$x" '${x}'
endif

---

(makefile
  (conditional_directive
    (condition
      (comparison
        arg1: (text
          (variable_reference
            (variable)))
        arg2: (text
          (variable_reference
            (variable))))))
  (conditional_directive
    (condition
      (comparison
        arg1: (text
          (variable_reference
            (variable)))
        arg2: (text
          (variable_reference
            (variable)))))))

================================================
Directive, conditional, variable name, expansion
================================================
ifdef ${x}
endif

ifndef ${x}$y
endif

---

(makefile
  (conditional_directive
    (condition
      (variable
        (variable_reference
          (variable)))))
  (conditional_directive
    (condition
      (variable
        (variable_reference
          (variable))
        (variable_reference
          (variable))))))


================================================
TODO
================================================
ifeq "\" '\'
endif

