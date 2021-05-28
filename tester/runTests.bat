@echo off
cd tests\undirected\basic
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd coloring
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..\..\..