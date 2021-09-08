@echo off
cd tests\undirected\basic
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd coloring
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd degrees
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd hasse_diagram
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd heaps
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..
cd properties
for /R %%f in (.\*) do python ..\..\..\run_unit_tests.py "%%f"
cd ..\..\..
pause