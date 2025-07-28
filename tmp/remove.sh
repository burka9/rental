#!/bin/bash


url="http://localhost:4000/lease/terminate"


#curl -X POST $url

i=0

while read -r line; do
  id="${line%,}"  # remove the trailing comma
  echo "Processing ID: $id"
  # do whatever you want with $id

  item="${url}/${id}"

  curl -X POST "$item"

  ((i++))
done < old_shareholders_id.txt

echo -e "\nProcessed total: $i"
