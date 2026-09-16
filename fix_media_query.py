import os

file_path = 'src/pages/CompoundsPage/CompoundsPage.css'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the existing media query block
media_query = """@media (min-width: 768px) {
  .table-container {
    display: block;
  }
  .mobile-list {
    display: none;
  }
}"""

if media_query in content:
    content = content.replace(media_query, '')
    
    # Append it to the end
    content += '\n\n' + media_query + '\n'
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed media query order in CompoundsPage.css")
else:
    print("Media query not found exactly as expected.")
