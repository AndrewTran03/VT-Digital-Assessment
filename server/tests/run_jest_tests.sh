#! /bin/bash

rm -rf ./tests/coverage # Remove any existing coverage directory

echo "|-------- Beginning of Running Jest Testing Back-End Script --------|"
echo "|-------- Running Jest Testing Now --------|"
jest --verbose --debug --coverage --color

echo "|-------- Show Jest Testing Code-Coverage --------|"
open ./tests/coverage/lcov-report/index.html

echo "|-------- End of Running Jest Testing Back-End Script --------|"
