#!/bin/sh
# Use jsish to check no ES6 features are used such as let/const, for-of, =>, {x, f()}
jsish -W -es5lint .

