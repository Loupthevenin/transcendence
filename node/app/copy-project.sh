#!/bin/bash

filename=$(basename "$0")

# Define source and destination directories
source_dir=$(dirname $(realpath $0)) # Current project root
dest_dir="$source_dir/dist" # 'dist' folder

# Function to recursively copy files and folders while excluding certain patterns
copy_files() {
  local src="$1"
  local dest="$2"

  if [[ ! -d "$dest" ]]; then
    mkdir -p "$dest"
    echo "Created destination folder: \"$dest\""
  fi

  # Iterate through source directory entries
  for entry in "$src"/*; do
    # Get the file name
    local entry_name=$(basename "$entry")

    # Exclude patterns
    if [[ "$entry_name" == "node_modules" \
      || "$entry_name" == "dist" \
      || $entry_name == *.ts \
      || "$entry_name" == filename ]]; then
      continue
    fi

    # Handle directories and files
    if [[ -d "$entry" ]]; then
      # Recursively copy directories
      copy_files "$entry" "$dest/$entry_name"
    elif [[ -f "$entry" ]]; then
      # Copy files
      cp "$entry" "$dest/$entry_name"
      echo "Copying '$entry' to '$dest/$entry_name'"
    fi
  done
}

# Main script execution
echo "Copying files from '$source_dir' to '$dest_dir'..."
copy_files "$source_dir" "$dest_dir"
echo "Copy completed successfully!"
