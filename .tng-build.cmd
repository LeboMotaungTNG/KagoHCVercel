@echo on
REM Build a commit on top of origin/main using a TEMP index so the real
REM .git/index, HEAD, working tree and refs stay untouched.
REM
REM Steps:
REM   1. Snapshot the current working tree into a tree object T (against HEAD).
REM   2. Read T into temp index, then overlay origin/main's vercel.json blob
REM      so that origin's most recent change is preserved.
REM   3. Write the final tree and create commit-tree with parent=origin/main.

set GIT_INDEX_FILE=%CD%\.tng-temp-index
if exist .tng-temp-index del .tng-temp-index

REM 1. Snapshot working tree into temp index
git read-tree HEAD
git add -A > .tng-log-add.txt 2>&1
git write-tree > .tng-tree.txt 2>&1
set /p TREE=<.tng-tree.txt
echo TREE=%TREE%

REM 2. Re-seed temp index with that tree, then overlay vercel.json blob
del .tng-temp-index
git read-tree %TREE%
for /f "delims=" %%i in ('git rev-parse origin/main:vercel.json') do set VBLOB=%%i
echo VERCEL_BLOB=%VBLOB%
git update-index --cacheinfo 100644,%VBLOB%,vercel.json

REM 3. Write the merged tree and create the commit-tree
git write-tree > .tng-tree2.txt
set /p TREE2=<.tng-tree2.txt
echo FINAL_TREE=%TREE2%

for /f "delims=" %%i in ('git rev-parse origin/main') do set PARENT=%%i
echo PARENT=%PARENT%

git commit-tree %TREE2% -p %PARENT% < .tng-commit-msg.txt > .tng-commit-sha.txt 2>&1
type .tng-commit-sha.txt

set /p SHA=<.tng-commit-sha.txt
git tag -f origin-publish %SHA%

if exist .tng-temp-index del .tng-temp-index
del .tng-tree.txt .tng-tree2.txt .tng-log-add.txt
