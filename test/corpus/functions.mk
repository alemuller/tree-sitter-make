================================================================================
function call arguments
================================================================================
$(call one,two)

--------------------------------------------------------------------------------

(makefile
  (function_call
    (arguments
      (argument
        (word))
      (argument
        (word)))))

================================================================================
function call arguments with whitespace
================================================================================
$(call one, two, three ,four)

--------------------------------------------------------------------------------

(makefile
  (function_call
    (arguments
      (argument
        (word))
      (argument
        (word))
      (argument
        (word))
      (argument
        (word)))))

================================================================================
foreach function with embedded calls
================================================================================
$(foreach prog,$(PROGRAMS),$(eval $(call PROGRAM_template,$(prog))))

--------------------------------------------------------------------------------

(makefile
  (function_call
    (arguments
      (argument
        (word))
      (argument
        (variable_reference
          (word)))
      (argument
        (function_call
          (arguments
            (argument
              (function_call
                (arguments
                  (argument
                    (word))
                  (argument
                    (variable_reference
                      (word))))))))))))

================================================================================
call to error function
================================================================================
$(error something bad happened)

--------------------------------------------------------------------------------

(makefile
  (function_call
    (arguments
      (argument
        (word)
        (word)
        (word)))))
