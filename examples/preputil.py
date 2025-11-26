import re
import sys

def update_import_paths(html_file):
    """
    Updates local JS and CSS import paths in the given HTML file.
    Changes paths starting with /js or /css to ../js or ../css.
    Also sets elements with id="expressionInput" or id="cola" to disabled.
    """
    try:
        # Read the HTML file
        with open(html_file, 'r') as file:
            content = file.read()

        # Update paths for JS and CSS imports
        updated_content = re.sub(r'href="/css', r'href="../css', content)
        updated_content = re.sub(r'src="/js', r'src="../js', updated_content)

        # Set elements with id="expressionInput" or id="cola" to disabled
        updated_content = re.sub(
            r'(<[^>]*\bid="expressionInput"[^>]*)(?<!disabled)>',
            r'\1 disabled>',
            updated_content
        )
        updated_content = re.sub(
            r'(<[^>]*\bid="cola"[^>]*)(?<!disabled)>',
            r'\1 disabled>',
            updated_content
        )

        # Write the updated content back to the file
        with open(html_file, 'w') as file:
            file.write(updated_content)

        print(f"Updated import paths and disabled elements in {html_file}")

    except FileNotFoundError:
        print(f"Error: File {html_file} not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python preputil.py <html_file>")
    else:
        html_file = sys.argv[1]
        update_import_paths(html_file)