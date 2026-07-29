# How to Move Files in Bulk in Unix/Bash

Moving files in bulk in a Linux/Bash terminal is typically done using wildcards, loops, or specialized commands like `find`. Here are the most common and useful ways to do it depending on your use case:

### 1. Using Wildcards (`*`)
If you want to move all files of a specific type (or all files in a folder) to a new destination, you can use the asterisk wildcard.
```bash
# Move ALL files from the current folder to /destination/folder
mv * /destination/folder/

# Move only .txt files to a new folder
mv *.txt /destination/folder/

# Move files starting with "data_"
mv data_* /destination/folder/
```

### 2. Using Brace Expansion (`{}`)
If you want to move specific file types or specific named files all at once without typing multiple commands.
```bash
# Move both .png and .jpg files at once
mv *.{png,jpg} /destination/folder/

# Move three specific files at once
mv {file1.txt,file2.txt,data.csv} /destination/folder/
```

### 3. Moving Everything EXCEPT Certain Files
If you want to move everything *except* a specific file type, you can use extended globbing (needs to be enabled via `shopt -s extglob` if it isn't already).
```bash
# Move everything EXCEPT .csv files
mv !(*.csv) /destination/folder/
```

### 4. Using a `for` Loop (For Advanced Renaming/Moving)
If you need to change the names of the files *while* you move them (for example, adding a prefix to all files), a loop is the best approach.
```bash
# Move all .txt files to a folder and add the prefix "old_" to them
for file in *.txt; do
    mv "$file" "/destination/folder/old_$file"
done
```

### 5. Using `find` (For Complex Searches)
If you need to move files based on complex criteria (like files in subdirectories, files modified older than X days, etc.), use `find` combined with `-exec`.
```bash
# Find all .mp3 files inside ANY subfolder and move them to a single folder
find . -name "*.mp3" -exec mv {} /destination/folder/ \;

# Find files older than 30 days and move them to an archive folder
find . -mtime +30 -exec mv {} /archive/folder/ \;
```

**Pro Tip:** If you aren't sure what your `mv` command is going to do, you can add the `-i` flag (interactive) which will prompt you before it overwrites any existing files:
```bash
mv -i *.txt /destination/folder/
```
